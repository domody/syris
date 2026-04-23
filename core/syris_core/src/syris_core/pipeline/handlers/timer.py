"""Fastpath handler for timer/reminder events."""
import re
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ...scheduler.loop import compute_initial_next_run
from ...schemas.events import MessageEvent
from ...schemas.pipeline import RouteDecision
from ...storage.db import session_scope
from ...storage.models import ScheduleRow
from ...storage.repos.schedules import ScheduleRepo
from ..executor import PipelineHandler

_TIMER_PATTERNS = [
    re.compile(
        r"(?:set (?:a )?)?timer (?:for )?(\d+)\s*(s|sec|seconds?|m|min|minutes?|h|hr|hours?)",
        re.I,
    ),
    re.compile(
        r"remind me in (\d+)\s*(s|m|h|min|sec|hour|minute)s?\s*(?:to\s+.+)?",
        re.I,
    ),
]

_UNIT_TO_SECONDS: dict[str, int] = {
    "s": 1, "sec": 1, "second": 1, "seconds": 1,
    "m": 60, "min": 60, "minute": 60, "minutes": 60,
    "h": 3600, "hr": 3600, "hour": 3600, "hours": 3600,
}


def _parse_duration(content: str) -> int:
    """Extract duration in seconds from a timer/reminder phrase.

    Returns 60 as a safe fallback if no pattern matches.
    """
    for pattern in _TIMER_PATTERNS:
        m = pattern.search(content)
        if m:
            amount = int(m.group(1))
            unit = m.group(2).lower()
            return amount * _UNIT_TO_SECONDS.get(unit, 60)
    return 60


def make_timer_set_handler(
    session_maker: async_sessionmaker[AsyncSession],
) -> PipelineHandler:
    """Fastpath handler for timer/reminder events matched by regex."""

    async def handler(event: MessageEvent, decision: RouteDecision) -> str:
        s = event.structured
        interval_s: int = s.get("interval_s") or _parse_duration(event.content)
        name = s.get("name", f"timer-{event.event_id}")
        now = datetime.now(timezone.utc)
        run_at = now + timedelta(seconds=interval_s)

        schedule_id = uuid4()
        row = ScheduleRow(
            schedule_id=schedule_id,
            name=name,
            schedule_type="one_shot",
            run_at=run_at,
            event_source=event.source,
            event_content=s.get("event_content", ""),
            event_structured=s.get("event_structured", {}),
            next_run_at=compute_initial_next_run("one_shot", run_at=run_at),
        )
        async with session_scope(session_maker) as session:
            await ScheduleRepo(session).create(row)

        return f"Created timer '{name}' runs in {interval_s}s id={schedule_id}"

    return handler
