"""
Crash recovery for the task engine.

Called once at startup before the claim loop begins. Finds all tasks that
were left in a running state (i.e., the process died mid-execution) and
resets them so the engine will re-claim and re-run them safely.

Recovery strategy
-----------------
For each task in status=``running``:
  1. Find any step in status=``running`` — that step was mid-execution at
     crash time. Reset it to ``pending`` (preserving attempt_count so that
     max_attempts is respected). The step's idempotency_key is stable, so
     the handler will be called again; external side-effects must be
     idempotent at the tool level.
  2. Set the task itself to ``pending`` so that claim_and_run() picks it up
     again. Completed steps are kept as-is; execution resumes from the first
     non-completed step.

If a task is in status=``running`` but all its steps are already completed,
it is transitioned directly to ``completed`` (this handles the edge case
where the process crashed between the last step completing and the task
being finalised).
"""
import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from ..observability.audit import AuditWriter
from ..storage.models import TaskRow, TaskStepRow
from ..storage.repos.tasks import TaskRepo

logger = logging.getLogger(__name__)


class TaskRecovery:
    """Startup reconciler for in-flight tasks."""

    def __init__(self, audit: AuditWriter) -> None:
        self._audit = audit

    async def reconcile(self, session: AsyncSession) -> list[uuid.UUID]:
        """
        Reconcile all stale running tasks.

        Must be called with an active session that will be committed by the
        caller (or via session_scope). Returns the list of task_ids that were
        reset to pending.
        """
        repo = TaskRepo(session)
        running_tasks = await repo.get_running_tasks()

        reset_task_ids: list[uuid.UUID] = []

        for task_row in running_tasks:
            steps = await repo.get_steps(task_row.task_id)

            # Check whether all steps already completed
            non_terminal = [
                s for s in steps if s.status not in ("completed", "skipped", "failed")
            ]
            all_done = all(
                s.status in ("completed", "skipped") for s in steps
            ) and len(steps) > 0

            if all_done:
                # Finalise task that was interrupted after last step
                await session.execute(
                    update(TaskRow)
                    .where(TaskRow.task_id == task_row.task_id)
                    .values(
                        status="completed",
                        updated_at=datetime.now(timezone.utc),
                        completed_at=datetime.now(timezone.utc),
                    )
                )
                await self._audit.emit(
                    task_row.trace_id,
                    stage="task",
                    type="task.recovery.finalised",
                    summary=(
                        f"Task {task_row.task_id} finalised during recovery — "
                        "all steps were already completed"
                    ),
                    outcome="success",
                    ref_task_id=task_row.task_id,
                )
                logger.info(
                    "task.recovery.finalised task_id=%s", task_row.task_id
                )
                continue

            any_failed = any(s.status == "failed" for s in steps)
            if any_failed and not any(
                s.status in ("pending", "running") for s in steps
            ):
                # Task was failing — leave it in running for the engine to finalise
                # Actually reset to running so engine picks it up and fails it cleanly
                pass

            # Reset any mid-flight step to pending for retry
            for step in steps:
                if step.status == "running":
                    await session.execute(
                        update(TaskStepRow)
                        .where(TaskStepRow.step_id == step.step_id)
                        .values(
                            status="pending",
                            updated_at=datetime.now(timezone.utc),
                        )
                    )
                    await self._audit.emit(
                        task_row.trace_id,
                        stage="task",
                        type="task.recovery.step_reset",
                        summary=(
                            f"Task {task_row.task_id} step {step.step_index} "
                            f"({step.tool_name}) reset to pending during recovery "
                            f"(was running at crash)"
                        ),
                        outcome="info",
                        ref_task_id=task_row.task_id,
                        ref_step_id=step.step_id,
                        tool_name=step.tool_name,
                    )
                    logger.info(
                        "task.recovery.step_reset task_id=%s step=%d",
                        task_row.task_id,
                        step.step_index,
                    )

            # Reset task to pending so the engine re-claims it
            await session.execute(
                update(TaskRow)
                .where(TaskRow.task_id == task_row.task_id)
                .values(
                    status="pending",
                    updated_at=datetime.now(timezone.utc),
                )
            )
            await self._audit.emit(
                task_row.trace_id,
                stage="task",
                type="task.recovery.requeued",
                summary=(
                    f"Task {task_row.task_id} requeued during startup recovery"
                ),
                outcome="info",
                ref_task_id=task_row.task_id,
            )
            logger.info("task.recovery.requeued task_id=%s", task_row.task_id)
            reset_task_ids.append(task_row.task_id)

        return reset_task_ids
