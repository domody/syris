"""Task repository — data access only, no business logic."""
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import TaskRow, TaskStepRow
from ...schemas.tasks import RetryPolicy, Task, TaskStep


class TaskRepo:
    """Thin data-access wrapper for the tasks and task_steps tables."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    # -------------------------------------------------------------------------
    # Task operations
    # -------------------------------------------------------------------------

    async def create_task(self, task: Task) -> TaskRow:
        """Persist a new Task row. Returns the inserted ORM row."""
        row = TaskRow(
            task_id=task.task_id,
            trace_id=task.trace_id,
            status=task.status,
            handler=task.handler,
            input_payload=task.input_payload,
            checkpoint=task.checkpoint,
            retry_policy=task.retry_policy.model_dump(),
            error=task.error,
            created_at=task.created_at,
            updated_at=task.updated_at,
            started_at=task.started_at,
            completed_at=task.completed_at,
        )
        self._session.add(row)
        await self._session.flush()
        return row

    async def create_step(self, step: TaskStep) -> TaskStepRow:
        """Persist a new TaskStep row. Returns the inserted ORM row."""
        row = TaskStepRow(
            step_id=step.step_id,
            task_id=step.task_id,
            step_index=step.step_index,
            status=step.status,
            tool_name=step.tool_name,
            input_payload=step.input_payload,
            output_payload=step.output_payload,
            idempotency_key=step.idempotency_key,
            attempt_count=step.attempt_count,
            max_attempts=step.max_attempts,
            risk_level=step.risk_level,
            pending_approval_id=step.pending_approval_id,
            error=step.error,
            created_at=step.created_at,
            updated_at=step.updated_at,
            started_at=step.started_at,
            completed_at=step.completed_at,
        )
        self._session.add(row)
        await self._session.flush()
        return row

    async def claim_one(self) -> Optional[TaskRow]:
        """
        Atomically claim one pending task.

        Uses FOR UPDATE SKIP LOCKED so that concurrent workers never
        double-claim the same task.  Returns None if no pending task exists.
        """
        stmt = (
            select(TaskRow)
            .where(TaskRow.status == "pending")
            .order_by(TaskRow.created_at)
            .limit(1)
            .with_for_update(skip_locked=True)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_task(self, task_id: uuid.UUID) -> Optional[TaskRow]:
        """Return a TaskRow by PK or None."""
        return await self._session.get(TaskRow, task_id)

    async def get_steps(self, task_id: uuid.UUID) -> list[TaskStepRow]:
        """Return all steps for a task ordered by step_index."""
        stmt = (
            select(TaskStepRow)
            .where(TaskStepRow.task_id == task_id)
            .order_by(TaskStepRow.step_index)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def update_task_status(
        self,
        task_id: uuid.UUID,
        status: str,
        *,
        error: Optional[str] = None,
        checkpoint: Optional[dict] = None,
        started_at: Optional[datetime] = None,
        completed_at: Optional[datetime] = None,
    ) -> None:
        """Update task status and optional metadata fields."""
        values: dict = {"status": status, "updated_at": datetime.now(timezone.utc)}
        if error is not None:
            values["error"] = error
        if checkpoint is not None:
            values["checkpoint"] = checkpoint
        if started_at is not None:
            values["started_at"] = started_at
        if completed_at is not None:
            values["completed_at"] = completed_at
        stmt = (
            update(TaskRow)
            .where(TaskRow.task_id == task_id)
            .values(**values)
        )
        await self._session.execute(stmt)

    async def update_step_status(
        self,
        step_id: uuid.UUID,
        status: str,
        *,
        error: Optional[str] = None,
        output_payload: Optional[dict] = None,
        attempt_count: Optional[int] = None,
        started_at: Optional[datetime] = None,
        completed_at: Optional[datetime] = None,
        pending_approval_id: Optional[uuid.UUID] = None,
        clear_approval_id: bool = False,
    ) -> None:
        """Update step status and optional metadata fields."""
        values: dict = {"status": status, "updated_at": datetime.now(timezone.utc)}
        if error is not None:
            values["error"] = error
        if output_payload is not None:
            values["output_payload"] = output_payload
        if attempt_count is not None:
            values["attempt_count"] = attempt_count
        if started_at is not None:
            values["started_at"] = started_at
        if completed_at is not None:
            values["completed_at"] = completed_at
        if pending_approval_id is not None:
            values["pending_approval_id"] = pending_approval_id
        if clear_approval_id:
            values["pending_approval_id"] = None
        stmt = (
            update(TaskStepRow)
            .where(TaskStepRow.step_id == step_id)
            .values(**values)
        )
        await self._session.execute(stmt)

    async def get_running_tasks(self) -> list[TaskRow]:
        """Return all tasks with status 'running'. Used by crash recovery."""
        stmt = select(TaskRow).where(TaskRow.status == "running")
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def list_tasks(self, limit: int = 100) -> list[TaskRow]:
        """Return recent tasks ordered by creation time descending."""
        stmt = (
            select(TaskRow)
            .order_by(TaskRow.created_at.desc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())
