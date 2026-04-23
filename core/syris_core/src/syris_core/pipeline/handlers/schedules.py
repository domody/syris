"""Fastpath handlers for schedule management."""
import logging

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ...observability.audit import AuditWriter
from ...schemas.events import MessageEvent
from ...schemas.pipeline import RouteDecision
from ...storage.db import session_scope
from ...storage.models import ScheduleRow
from ...storage.repos.schedules import ScheduleRepo
from ..executor import PipelineHandler
from ._util import _extract_identifier, _parse_identifier

logger = logging.getLogger(__name__)


async def _resolve_schedule(
    repo: ScheduleRepo,
    event: MessageEvent,
) -> tuple[ScheduleRow | None, str | None]:
    """Return (row, None) on success or (None, error_string) on failure.

    Looks up identifier from event.content first, then event.structured.
    Handles name ambiguity by returning a descriptive error.
    """
    raw = _extract_identifier(event.content, "schedule")
    if not raw:
        raw = str(event.structured.get("schedule_id", ""))
    if not raw:
        return None, "schedule identifier missing from request"

    uuid, name = _parse_identifier(raw)
    if uuid:
        row = await repo.get(uuid)
        if row is None:
            return None, f"Schedule {uuid} not found"
        return row, None

    rows = await repo.find_by_name(name)
    if not rows:
        return None, f"No schedule named '{name}' found"
    if len(rows) > 1:
        ids = ", ".join(str(r.schedule_id) for r in rows)
        return None, f"Multiple schedules named '{name}' — specify by UUID: {ids}"
    return rows[0], None


def make_schedule_list_handler(
    session_maker: async_sessionmaker[AsyncSession],
) -> PipelineHandler:
    """Handler for schedule.list: returns a summary of all schedules."""

    async def handler(event: MessageEvent, decision: RouteDecision) -> str:
        async with session_scope(session_maker) as session:
            rows = await ScheduleRepo(session).list_all()
        if not rows:
            return "No schedules configured."
        lines = [
            f"  {r.schedule_id} '{r.name}' type={r.schedule_type} enabled={r.enabled}"
            for r in rows
        ]
        return f"Schedules ({len(rows)}):\n" + "\n".join(lines)

    return handler


def make_schedule_cancel_handler(
    session_maker: async_sessionmaker[AsyncSession],
    audit: AuditWriter,
) -> PipelineHandler:
    """Handler for schedule.cancel: disables a schedule by UUID or name."""

    async def handler(event: MessageEvent, decision: RouteDecision) -> str:
        async with session_scope(session_maker) as session:
            repo = ScheduleRepo(session)
            row, error = await _resolve_schedule(repo, event)
            if error:
                return error
            await repo.update_fields(row.schedule_id, enabled=False)

        await audit.emit(
            event.trace_id,
            stage="schedule",
            type="schedule.cancelled",
            summary=f"Schedule {row.schedule_id} cancelled via pipeline",
            outcome="success",
            ref_event_id=event.event_id,
            connector_id=str(row.schedule_id),
        )
        return f"Cancelled schedule {row.schedule_id}"

    return handler


def make_schedule_pause_handler(
    session_maker: async_sessionmaker[AsyncSession],
    audit: AuditWriter,
) -> PipelineHandler:
    """Handler for schedule.pause: pauses a schedule by UUID or name."""

    async def handler(event: MessageEvent, decision: RouteDecision) -> str:
        async with session_scope(session_maker) as session:
            repo = ScheduleRepo(session)
            row, error = await _resolve_schedule(repo, event)
            if error:
                return error
            await repo.update_fields(row.schedule_id, enabled=False)

        await audit.emit(
            event.trace_id,
            stage="schedule",
            type="schedule.paused",
            summary=f"Schedule {row.schedule_id} paused via pipeline",
            outcome="success",
            ref_event_id=event.event_id,
            connector_id=str(row.schedule_id),
        )
        return f"Paused schedule {row.schedule_id}"

    return handler
