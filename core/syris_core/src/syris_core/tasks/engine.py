"""
Task engine — claim → execute → checkpoint loop.

The engine is the public API for the task subsystem. It:
- Accepts task submissions (persisting them to DB as pending).
- Claims one pending task at a time via FOR UPDATE SKIP LOCKED.
- Drives each step in order using StepRunner.
- Handles operator actions: cancel, pause, resume.

Handler registration
--------------------
Callers inject a dict[str, StepHandler] at construction time where the key
matches TaskStep.tool_name. For testing, register a NoopTool callable. In
production, the tools runtime will populate this registry.

StepHandler protocol
--------------------
A StepHandler is any async callable with signature:
    async def handler(input_payload: dict[str, Any]) -> dict[str, Any]
"""
import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Coroutine, Optional

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ..observability.audit import AuditWriter
from ..safety.gates import GateChecker
from ..schemas.tasks import RetryPolicy, StepSpec, Task, TaskStep, TaskSubmit
from ..storage.db import session_scope
from ..storage.repos.tasks import TaskRepo
from .state import IllegalStateTransition, assert_task_transition
from .step_runner import StepRunner

logger = logging.getLogger(__name__)

# A StepHandler is an async callable: input_payload → output_payload
StepHandler = Callable[[dict[str, Any]], Coroutine[Any, Any, dict[str, Any]]]


class UnknownHandlerError(Exception):
    """Raised when a step's tool_name is not registered."""


class TaskEngine:
    """
    Core task engine.

    Constructed once per process lifetime and shared across all concurrent
    claim loops (or called manually in tests).
    """

    def __init__(
        self,
        session_maker: async_sessionmaker[AsyncSession],
        audit: AuditWriter,
        handlers: dict[str, StepHandler],
        gate_checker: Optional[GateChecker] = None,
    ) -> None:
        self._session_maker = session_maker
        self._audit = audit
        self._handlers = handlers
        self._gate_checker = gate_checker
        self._runner = StepRunner(audit, gate_checker=gate_checker)

    # -------------------------------------------------------------------------
    # Public API
    # -------------------------------------------------------------------------

    async def submit(self, request: TaskSubmit) -> Task:
        """
        Persist a new task (with all its steps) as pending.

        Returns the Task schema object. Does not start execution —
        call claim_and_run() to drive it.
        """
        task = Task(
            trace_id=request.trace_id,
            handler=request.handler,
            input_payload=request.input_payload,
            retry_policy=request.retry_policy,
        )
        steps = [
            TaskStep(
                task_id=task.task_id,
                step_index=i,
                tool_name=spec.tool_name,
                input_payload=spec.input_payload,
                idempotency_key=f"{task.task_id}:{i}",
                max_attempts=spec.max_attempts,
                risk_level=spec.risk_level,
            )
            for i, spec in enumerate(request.steps)
        ]

        async with session_scope(self._session_maker) as session:
            repo = TaskRepo(session)
            await repo.create_task(task)
            for step in steps:
                await repo.create_step(step)

        await self._audit.emit(
            task.trace_id,
            stage="task",
            type="task.submitted",
            summary=f"Task {task.task_id} submitted ({len(steps)} steps)",
            outcome="info",
            ref_task_id=task.task_id,
        )
        logger.info("task.submitted task_id=%s steps=%d", task.task_id, len(steps))
        return task

    async def claim_and_run(self) -> bool:
        """
        Claim one pending task and run it to a terminal state.

        Returns True if a task was found and run, False if the queue is empty.
        """
        async with session_scope(self._session_maker) as session:
            repo = TaskRepo(session)
            task_row = await repo.claim_one()
            if task_row is None:
                return False

            now = datetime.now(timezone.utc)
            assert_task_transition(task_row.status, "running")
            await repo.update_task_status(
                task_row.task_id, "running", started_at=now
            )
            await self._audit.emit(
                task_row.trace_id,
                stage="task",
                type="task.claimed",
                summary=f"Task {task_row.task_id} claimed and running",
                outcome="info",
                ref_task_id=task_row.task_id,
            )

        # Run the task outside the claim transaction so that step updates
        # are individually committed (enabling crash recovery at step boundaries).
        await self._run_task(task_row.task_id, task_row.trace_id)
        return True

    async def cancel(self, task_id: uuid.UUID, trace_id: uuid.UUID) -> None:
        """Cancel a pending or running task."""
        async with session_scope(self._session_maker) as session:
            repo = TaskRepo(session)
            task_row = await repo.get_task(task_id)
            if task_row is None:
                raise ValueError(f"Task {task_id} not found")
            assert_task_transition(task_row.status, "cancelled")
            await repo.update_task_status(
                task_id, "cancelled", completed_at=datetime.now(timezone.utc)
            )

        await self._audit.emit(
            trace_id,
            stage="task",
            type="task.cancelled",
            summary=f"Task {task_id} cancelled by operator",
            outcome="info",
            ref_task_id=task_id,
        )
        logger.info("task.cancelled task_id=%s", task_id)

    async def pause(self, task_id: uuid.UUID, trace_id: uuid.UUID) -> None:
        """Pause a running task."""
        async with session_scope(self._session_maker) as session:
            repo = TaskRepo(session)
            task_row = await repo.get_task(task_id)
            if task_row is None:
                raise ValueError(f"Task {task_id} not found")
            assert_task_transition(task_row.status, "paused")
            await repo.update_task_status(task_id, "paused")

        await self._audit.emit(
            trace_id,
            stage="task",
            type="task.paused",
            summary=f"Task {task_id} paused by operator",
            outcome="info",
            ref_task_id=task_id,
        )

    async def resume(self, task_id: uuid.UUID, trace_id: uuid.UUID) -> None:
        """Resume a paused task (sets it back to pending for re-claim)."""
        async with session_scope(self._session_maker) as session:
            repo = TaskRepo(session)
            task_row = await repo.get_task(task_id)
            if task_row is None:
                raise ValueError(f"Task {task_id} not found")
            assert_task_transition(task_row.status, "running")
            await repo.update_task_status(task_id, "pending")

        await self._audit.emit(
            trace_id,
            stage="task",
            type="task.resumed",
            summary=f"Task {task_id} resumed — returned to pending queue",
            outcome="info",
            ref_task_id=task_id,
        )

    # -------------------------------------------------------------------------
    # Internal
    # -------------------------------------------------------------------------

    async def _run_task(self, task_id: uuid.UUID, trace_id: uuid.UUID) -> None:
        """Drive all pending/running steps in order until the task reaches terminal state."""
        retry_policy: RetryPolicy | None = None

        while True:
            async with session_scope(self._session_maker) as session:
                repo = TaskRepo(session)
                task_row = await repo.get_task(task_id)
                if task_row is None:
                    logger.error("task._run_task task_id=%s not found", task_id)
                    return

                # Operator may have cancelled/paused between steps
                if task_row.status in ("cancelled", "paused"):
                    logger.info(
                        "task._run_task task_id=%s halted — status=%s",
                        task_id,
                        task_row.status,
                    )
                    return

                if retry_policy is None:
                    retry_policy = RetryPolicy(**task_row.retry_policy)

                steps = await repo.get_steps(task_id)

            # Find the next step to execute
            next_step = None
            for step in steps:
                if step.status == "completed" or step.status == "skipped":
                    continue
                if step.status in ("pending", "running"):
                    next_step = step
                    break
                if step.status == "gated":
                    # Step is awaiting approval — pause the task
                    await self._gate_task(task_id, trace_id, step)
                    return
                if step.status == "failed":
                    # A failed step means the task fails
                    await self._fail_task(task_id, trace_id, step)
                    return

            if next_step is None:
                # All steps completed
                await self._complete_task(task_id, trace_id)
                return

            # Execute the step
            handler = self._handlers.get(next_step.tool_name)
            if handler is None:
                await self._fail_task(
                    task_id,
                    trace_id,
                    next_step,
                    reason=f"No handler registered for tool '{next_step.tool_name}'",
                )
                return

            async with session_scope(self._session_maker) as session:
                step_row = await session.get(type(next_step), next_step.step_id)
                if step_row is None:
                    logger.error(
                        "task._run_task step_id=%s not found", next_step.step_id
                    )
                    return

                # Reset step to pending if it somehow got into running state
                # (happens after recovery reset; step_runner will transition it)
                if step_row.status == "running":
                    from ..storage.models import TaskStepRow
                    from sqlalchemy import update as sa_update
                    stmt = (
                        sa_update(TaskStepRow)
                        .where(TaskStepRow.step_id == step_row.step_id)
                        .values(status="pending", updated_at=datetime.now(timezone.utc))
                    )
                    await session.execute(stmt)
                    await session.refresh(step_row)

                updated_step = await self._runner.run(
                    task_row=task_row,
                    step_row=step_row,
                    handler=handler,
                    session=session,
                )

            if updated_step.status == "pending":
                # Retry scheduled — apply backoff before looping
                backoff = retry_policy.backoff_s
                if backoff > 0:
                    await asyncio.sleep(backoff)

    async def _gate_task(
        self,
        task_id: uuid.UUID,
        trace_id: uuid.UUID,
        gated_step: Any,
    ) -> None:
        """Pause a task because a step is waiting for gate approval."""
        async with session_scope(self._session_maker) as session:
            repo = TaskRepo(session)
            task_row = await repo.get_task(task_id)
            if task_row is None:
                return
            if task_row.status == "running":
                assert_task_transition(task_row.status, "paused")
                await repo.update_task_status(task_id, "paused")

        await self._audit.emit(
            trace_id,
            stage="task",
            type="task.gated",
            summary=(
                f"Task {task_id} paused — step {gated_step.step_index} "
                f"({gated_step.tool_name}) awaiting gate approval"
            ),
            outcome="info",
            ref_task_id=task_id,
            ref_step_id=gated_step.step_id,
        )
        logger.info(
            "task.gated task_id=%s step=%s waiting_approval=%s",
            task_id,
            gated_step.step_index,
            getattr(gated_step, "pending_approval_id", None),
        )

    async def _complete_task(
        self, task_id: uuid.UUID, trace_id: uuid.UUID
    ) -> None:
        async with session_scope(self._session_maker) as session:
            repo = TaskRepo(session)
            task_row = await repo.get_task(task_id)
            if task_row is None:
                return
            assert_task_transition(task_row.status, "completed")
            await repo.update_task_status(
                task_id, "completed", completed_at=datetime.now(timezone.utc)
            )
        await self._audit.emit(
            trace_id,
            stage="task",
            type="task.completed",
            summary=f"Task {task_id} completed — all steps done",
            outcome="success",
            ref_task_id=task_id,
        )
        logger.info("task.completed task_id=%s", task_id)

    async def _fail_task(
        self,
        task_id: uuid.UUID,
        trace_id: uuid.UUID,
        failed_step: Any,
        reason: str | None = None,
    ) -> None:
        error = reason or getattr(failed_step, "error", "step failed")
        async with session_scope(self._session_maker) as session:
            repo = TaskRepo(session)
            task_row = await repo.get_task(task_id)
            if task_row is None:
                return
            assert_task_transition(task_row.status, "failed")
            await repo.update_task_status(
                task_id,
                "failed",
                error=error,
                completed_at=datetime.now(timezone.utc),
            )
        await self._audit.emit(
            trace_id,
            stage="task",
            type="task.failed",
            summary=f"Task {task_id} failed: {error}",
            outcome="failure",
            ref_task_id=task_id,
        )
        logger.warning("task.failed task_id=%s error=%s", task_id, error)
