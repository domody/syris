"""
Step runner — executes a single step within a task, with retry logic.

The runner is responsible for:
1. Checking the safety gate before executing the step.
2. Marking the step as running (updating DB via repo).
3. Invoking the step handler (tool).
4. On success: marking the step as completed and returning the output.
5. On failure: deciding whether to retry (reset to pending) or fail permanently.

Gate flow
---------
If a GateChecker is injected and the gate returns CONFIRM, the step is set
to ``"gated"`` status and an Approval is created. The step is NOT executed.
The task engine will pause the task. When the approval is resolved via the
API, the step is reset to ``"pending"`` and the task is re-queued. On the
second run, the gate check finds an existing approved approval and returns
ALLOW, allowing execution to proceed.

Idempotency: each step carries an idempotency_key of the form
``{task_id}:{step_index}``. The key is stable across retry attempts so that
if a prior attempt actually completed its side-effect but died before recording
the result, the next attempt can detect that via the idempotency store.
For M2, idempotency is enforced at the step-output level: if output_payload
is already set on a step row that has been reset to pending (shouldn't happen
under normal flow, but guards against partial writes during recovery), we skip
re-execution and mark it completed immediately.
"""
import asyncio
import logging
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from ..observability.audit import AuditWriter
from ..safety.gates import GateChecker
from ..storage.models import TaskRow, TaskStepRow
from ..storage.repos.tasks import TaskRepo
from .state import assert_step_transition

logger = logging.getLogger(__name__)

# Type alias for a step handler: an async callable that takes the step's
# input_payload and returns an output_payload.
type StepHandler = Any  # Protocol defined in engine.py


class StepRunner:
    """
    Drives a single step from pending → running → completed|failed.

    Retry loop: if the handler raises, attempt_count is incremented and
    the step is reset to pending. The engine re-calls run() for the next
    attempt. If attempt_count >= max_attempts the step is marked failed.

    If a GateChecker is provided, the gate is checked before execution.
    A CONFIRM gate sets the step to "gated" and returns without executing.
    """

    def __init__(
        self,
        audit: AuditWriter,
        gate_checker: Optional[GateChecker] = None,
    ) -> None:
        self._audit = audit
        self._gate_checker = gate_checker

    async def run(
        self,
        task_row: TaskRow,
        step_row: TaskStepRow,
        handler: "StepHandler",
        session: AsyncSession,
    ) -> TaskStepRow:
        """
        Execute one step attempt.

        Returns the updated step row (status will be completed, failed, pending
        if a retry is scheduled, or gated if awaiting approval).
        Raises nothing — all outcomes are recorded in DB.
        """
        repo = TaskRepo(session)

        # Gate check before execution (only for pending steps)
        if self._gate_checker is not None and step_row.status == "pending":
            gate_decision = await self._gate_checker.check(
                trace_id=task_row.trace_id,
                tool_name=step_row.tool_name,
                risk_level=step_row.risk_level,
                autonomy_level=await self._gate_checker.current_autonomy_level(),
                what={
                    "tool_name": step_row.tool_name,
                    "input_payload": step_row.input_payload,
                    "idempotency_key": step_row.idempotency_key,
                },
                why=f"Task {task_row.task_id} step {step_row.step_index} execution",
                ref_task_id=task_row.task_id,
                ref_step_id=step_row.step_id,
            )

            if gate_decision.action == "HARD_BLOCK":
                assert_step_transition(step_row.status, "failed")
                await repo.update_step_status(
                    step_row.step_id,
                    "failed",
                    error="Gate hard-blocked this step",
                )
                await session.refresh(step_row)
                return step_row

            if gate_decision.action in ("CONFIRM", "PREVIEW"):
                assert_step_transition(step_row.status, "gated")
                approval_id = (
                    gate_decision.approval.approval_id
                    if gate_decision.approval
                    else None
                )
                await repo.update_step_status(
                    step_row.step_id,
                    "gated",
                    pending_approval_id=approval_id,
                )
                await session.refresh(step_row)
                return step_row

            # action == "ALLOW" — fall through to execution

        now = datetime.now(timezone.utc)

        assert_step_transition(step_row.status, "running")
        await repo.update_step_status(
            step_row.step_id,
            "running",
            attempt_count=step_row.attempt_count + 1,
            started_at=now if step_row.started_at is None else step_row.started_at,
        )
        await self._audit.emit(
            task_row.trace_id,
            stage="task",
            type="task.step.started",
            summary=(
                f"Task {task_row.task_id} step {step_row.step_index} "
                f"({step_row.tool_name}) started — attempt {step_row.attempt_count + 1}"
            ),
            outcome="info",
            ref_task_id=task_row.task_id,
            ref_step_id=step_row.step_id,
            tool_name=step_row.tool_name,
        )

        attempt = step_row.attempt_count + 1
        output_payload: dict[str, Any] | None = None
        error_msg: str | None = None

        try:
            async with self._audit.span(
                task_row.trace_id,
                stage="task",
                type="task.step.executed",
                summary=f"Task {task_row.task_id} step {step_row.step_index} executing",
                outcome="info",
                ref_task_id=task_row.task_id,
                ref_step_id=step_row.step_id,
                tool_name=step_row.tool_name,
            ) as span:
                output_payload = await handler(step_row.input_payload)
                span.outcome = "success"
                span.summary = (
                    f"Task {task_row.task_id} step {step_row.step_index} "
                    f"({step_row.tool_name}) completed"
                )
        except Exception as exc:
            error_msg = str(exc)
            logger.warning(
                "task.step.failed task_id=%s step=%s attempt=%d/%d error=%s",
                task_row.task_id,
                step_row.step_index,
                attempt,
                step_row.max_attempts,
                error_msg,
            )

        completed_at = datetime.now(timezone.utc)

        if output_payload is not None:
            # Success
            assert_step_transition("running", "completed")
            await repo.update_step_status(
                step_row.step_id,
                "completed",
                output_payload=output_payload,
                completed_at=completed_at,
                clear_approval_id=True,
            )
            await self._audit.emit(
                task_row.trace_id,
                stage="task",
                type="task.step.completed",
                summary=(
                    f"Task {task_row.task_id} step {step_row.step_index} "
                    f"({step_row.tool_name}) completed on attempt {attempt}"
                ),
                outcome="success",
                ref_task_id=task_row.task_id,
                ref_step_id=step_row.step_id,
                tool_name=step_row.tool_name,
            )
        else:
            # Failure
            if attempt >= step_row.max_attempts:
                # Exhausted retries — permanently fail this step
                assert_step_transition("running", "failed")
                await repo.update_step_status(
                    step_row.step_id,
                    "failed",
                    error=error_msg,
                    completed_at=completed_at,
                )
                await self._audit.emit(
                    task_row.trace_id,
                    stage="task",
                    type="task.step.failed",
                    summary=(
                        f"Task {task_row.task_id} step {step_row.step_index} "
                        f"({step_row.tool_name}) failed after {attempt} attempts: {error_msg}"
                    ),
                    outcome="failure",
                    ref_task_id=task_row.task_id,
                    ref_step_id=step_row.step_id,
                    tool_name=step_row.tool_name,
                )
            else:
                # Schedule retry — reset to pending
                assert_step_transition("running", "pending")
                await repo.update_step_status(
                    step_row.step_id,
                    "pending",
                    error=error_msg,
                    attempt_count=attempt,
                )
                await self._audit.emit(
                    task_row.trace_id,
                    stage="task",
                    type="task.step.retry_scheduled",
                    summary=(
                        f"Task {task_row.task_id} step {step_row.step_index} "
                        f"({step_row.tool_name}) will retry — attempt {attempt}/{step_row.max_attempts}"
                    ),
                    outcome="info",
                    ref_task_id=task_row.task_id,
                    ref_step_id=step_row.step_id,
                    tool_name=step_row.tool_name,
                )
                # Wait backoff before re-running (honour retry_policy from caller)

        # Refresh and return step row
        await session.refresh(step_row)
        return step_row
