"""Built-in task management tools."""
import logging
from datetime import datetime, timezone
from typing import ClassVar
from uuid import UUID

from pydantic import BaseModel, Field

from ...storage.db import session_scope
from ...storage.repos.tasks import TaskRepo
from ...tasks.state import assert_task_transition
from ..base import BaseTool, RiskLevel, ToolDeps, ToolResult

logger = logging.getLogger(__name__)


class TaskStatusArgs(BaseModel):
    task_id: UUID = Field(..., description="UUID of the task to check")


class TaskStatusTool(BaseTool):
    name: ClassVar[str] = "task.status"
    description: ClassVar[str] = "Get the current status of a task by ID."
    args_schema: ClassVar[type[BaseModel]] = TaskStatusArgs
    risk_level: ClassVar[RiskLevel] = "low"
    idempotent: ClassVar[bool] = True

    async def execute(self, args: TaskStatusArgs) -> ToolResult:  # type: ignore[override]
        async with session_scope(self._deps.session_maker) as session:
            task = await TaskRepo(session).get_task(args.task_id)
        if task is None:
            raise ValueError(f"Task {args.task_id} not found")
        return ToolResult(
            summary=f"Task {args.task_id} status={task.status}",
            data={"task_id": str(args.task_id), "status": task.status},
        )


class TaskCancelArgs(BaseModel):
    task_id: UUID = Field(..., description="UUID of the task to cancel")


class TaskCancelTool(BaseTool):
    name: ClassVar[str] = "task.cancel"
    description: ClassVar[str] = "Cancel a pending or running task by ID."
    args_schema: ClassVar[type[BaseModel]] = TaskCancelArgs
    risk_level: ClassVar[RiskLevel] = "medium"
    idempotent: ClassVar[bool] = False

    async def execute(self, args: TaskCancelArgs) -> ToolResult:  # type: ignore[override]
        async with session_scope(self._deps.session_maker) as session:
            repo = TaskRepo(session)
            task = await repo.get_task(args.task_id)
            if task is None:
                raise ValueError(f"Task {args.task_id} not found")
            assert_task_transition(task.status, "cancelled")
            await repo.update_task_status(
                args.task_id,
                "cancelled",
                completed_at=datetime.now(timezone.utc),
            )
        return ToolResult(
            summary=f"Cancelled task {args.task_id}",
            data={"task_id": str(args.task_id)},
        )
