"""
Pipeline handler implementations.

Only two handlers live here:

  make_timer_set_handler   — Fastpath for regex-matched timer/reminder events.
                             Bypasses the LLM entirely for low-latency scheduling.

  LLMConversationHandler   — Primary handler for all non-fastpath events.
                             Makes a single conversational LLM call and returns
                             the response text. The Responder dispatches it as-is
                             (passthrough mode — no second LLM call).

All other system capabilities (schedules, tasks, approvals, autonomy) are
tools in the tool registry (tools/built_in/) and are invoked through the
LLM conversation path or the task engine step handler path.
"""
import logging
import re
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ..llm.client import LLMClient
from ..observability.audit import AuditWriter
from ..scheduler.loop import compute_initial_next_run
from ..schemas.events import MessageEvent
from ..schemas.pipeline import RouteDecision
from ..storage.db import session_scope
from ..storage.models import RuleRow, ScheduleRow
from ..storage.repos.events import EventRepo
from ..storage.repos.rules import RuleRepo
from ..storage.repos.schedules import ScheduleRepo
from .executor import PipelineHandler

logger = logging.getLogger(__name__)

# Duration patterns — same regexes as the router fastpath, kept in sync
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
    """Fastpath handler for timer/reminder events matched by regex.

    Reads schedule parameters from event.structured (populated by the
    normalizer from regex capture groups). Creates an one-shot
    schedule directly without LLM involvement.
    """

    async def handler(event: MessageEvent, decision: RouteDecision) -> str:
        # Parse duration directly from content — event.structured is empty
        # for plain-text timer phrases. Fallback to structured if pre-populated.
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


class LLMConversationHandler:
    """
    Primary pipeline handler for non-fastpath events.

    Makes a conversational LLM call with thread-scoped context and returns
    the response text. Persists the assistant reply as a MessageEvent so
    future turns in the same thread can see it.

    The Responder dispatches it as-is (response_mode="passthrough") — no
    second LLM call is made.
    """

    def __init__(
        self,
        llm_client: LLMClient,
        session_maker: async_sessionmaker[AsyncSession],
    ) -> None:
        self._llm = llm_client
        self._session_maker = session_maker

    async def __call__(self, event: MessageEvent, decision: RouteDecision) -> str:
        llm_response = await self._llm.chat(event)

        # Persist assistant reply so conversation history is complete
        reply_event = MessageEvent(
            trace_id=event.trace_id,
            thread_id=event.thread_id,
            source="llm",
            content=llm_response.content,
            parent_event_id=event.event_id,
        )
        async with session_scope(self._session_maker) as session:
            await EventRepo(session).create(reply_event)

        logger.info("llm_conversation.replied event_id=%s", event.event_id)
        return llm_response.content


def make_rule_list_handler(
    session_maker: async_sessionmaker[AsyncSession],
) -> PipelineHandler:
    """Handler for rule.list: returns a summary of all rules."""

    async def handler(event: MessageEvent, decision: RouteDecision) -> str:
        async with session_scope(session_maker) as session:
            rows = await RuleRepo(session).list_all()
        if not rows:
            return "No rules configured."
        lines = [
            f"  {r.rule_id} '{r.name}' enabled={r.enabled} debounce={r.debounce_s}s"
            for r in rows
        ]
        return f"Rules ({len(rows)}):\n" + "\n".join(lines)

    return handler


def make_rule_enable_handler(
    session_maker: async_sessionmaker[AsyncSession],
    audit: AuditWriter,
) -> PipelineHandler:
    """Handler for rule.enable: enables a rule by ID from event.structured['rule_id']."""

    async def handler(event: MessageEvent, decision: RouteDecision) -> str:
        rule_id = event.structured.get("rule_id")
        if not rule_id:
            return "rule_id missing from structured payload"
        async with session_scope(session_maker) as session:
            updated = await RuleRepo(session).update_fields(rule_id, enabled=True)
        if updated is None:
            return f"Rule {rule_id} not found"
        await audit.emit(
            event.trace_id,
            stage="rule",
            type="rule.enabled",
            summary=f"Rule {rule_id} enabled",
            outcome="success",
            ref_event_id=event.event_id,
            connector_id=str(rule_id),
        )
        return f"Rule {rule_id} enabled"

    return handler


def make_rule_disable_handler(
    session_maker: async_sessionmaker[AsyncSession],
    audit: AuditWriter,
) -> PipelineHandler:
    """Handler for rule.disable: disables a rule by ID from event.structured['rule_id']."""

    async def handler(event: MessageEvent, decision: RouteDecision) -> str:
        rule_id = event.structured.get("rule_id")
        if not rule_id:
            return "rule_id missing from structured payload"
        async with session_scope(session_maker) as session:
            updated = await RuleRepo(session).update_fields(rule_id, enabled=False)
        if updated is None:
            return f"Rule {rule_id} not found"
        await audit.emit(
            event.trace_id,
            stage="rule",
            type="rule.disabled",
            summary=f"Rule {rule_id} disabled",
            outcome="success",
            ref_event_id=event.event_id,
            connector_id=str(rule_id),
        )
        return f"Rule {rule_id} disabled"

    return handler


def make_rule_create_handler(
    session_maker: async_sessionmaker[AsyncSession],
    audit: AuditWriter,
) -> PipelineHandler:
    """Handler for rule.create: creates a rule from event.structured payload.

    Expected structured keys: name, conditions (list), action (dict).
    Optional: debounce_s (int), quiet_hours_policy_id (str UUID).
    """

    async def handler(event: MessageEvent, decision: RouteDecision) -> str:
        s = event.structured
        name = s.get("name", f"rule-{event.event_id}")
        conditions = s.get("conditions", [])
        action = s.get("action", {})
        debounce_s = int(s.get("debounce_s", 0))

        row = RuleRow(
            rule_id=uuid4(),
            name=name,
            conditions=conditions,
            action=action,
            debounce_s=debounce_s,
        )
        async with session_scope(session_maker) as session:
            saved = await RuleRepo(session).create(row)
            rule_id = saved.rule_id

        await audit.emit(
            event.trace_id,
            stage="rule",
            type="rule.created",
            summary=f"Rule '{name}' ({rule_id}) created via pipeline",
            outcome="success",
            ref_event_id=event.event_id,
            connector_id=str(rule_id),
        )
        return f"Created rule '{name}' id={rule_id}"

    return handler
