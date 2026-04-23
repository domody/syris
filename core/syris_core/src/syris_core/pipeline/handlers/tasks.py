"""Fastpath handlers for task management."""
import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ...observability.audit import AuditWriter
from ...schemas.events import MessageEvent
from ...schemas.pipeline import RouteDecision
from ...storage.db import session_scope
from ...storage.repos.tasks import TaskRepo
from ...tasks.state import assert_task_transition
from ..executor import PipelineHandler
from ._util import _extract_uuid

logger = logging.getLogger(__name__)


def make_task_status_handler(
    session_maker: async_sessionmaker[AsyncSession],
) -> PipelineHandler:
    """Handler for task.status: returns current status of a task by UUID."""

    async def handler(event: MessageEvent, decision: RouteDecision) -> str:
        task_id = _extract_uuid(event.content) or event.structured.get("task_id")
        if task_id is None:
            return "task_id missing from request"

        async with session_scope(session_maker) as session:
            task = await TaskRepo(session).get_task(task_id)
        if task is None:
            return f"Task {task_id} not found"
        return f"Task {task_id} status={task.status}"

    return handler


def make_task_cancel_handler(
    session_maker: async_sessionmaker[AsyncSession],
    audit: AuditWriter,
) -> PipelineHandler:
    """Handler for task.cancel: cancels a pending or running task by UUID."""

    async def handler(event: MessageEvent, decision: RouteDecision) -> str:
        task_id = _extract_uuid(event.content) or event.structured.get("task_id")
        if task_id is None:
            return "task_id missing from request"

        async with session_scope(session_maker) as session:
            repo = TaskRepo(session)
            task = await repo.get_task(task_id)
            if task is None:
                return f"Task {task_id} not found"
            try:
                assert_task_transition(task.status, "cancelled")
            except Exception as exc:
                return str(exc)
            await repo.update_task_status(
                task_id,
                "cancelled",
                completed_at=datetime.now(timezone.utc),
            )

        await audit.emit(
            event.trace_id,
            stage="task",
            type="task.cancelled",
            summary=f"Task {task_id} cancelled via pipeline",
            outcome="success",
            ref_event_id=event.event_id,
            connector_id=str(task_id),
        )
        return f"Cancelled task {task_id}"

    return handler
