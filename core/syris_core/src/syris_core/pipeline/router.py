import logging
import re

from ..observability.audit import AuditWriter
from ..schemas.events import MessageEvent
from ..schemas.pipeline import RouteDecision

logger = logging.getLogger(__name__)

# UUID pattern — 8-4-4-4-12 hex groups
_UUID_PAT = r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"

# Identifier pattern — UUID or a name slug (word chars, dots, hyphens).
# Used for resources that carry a human-readable name (schedules, rules).
_IDENT_PAT = rf"(?:{_UUID_PAT}|\w[\w.\-]*)"

# Fastpath patterns: regex → handler key.
# Only genuinely unambiguous, latency-sensitive patterns belong here.
# Everything else routes to "llm_conversation".
_FASTPATH: list[tuple[re.Pattern, str]] = [
    # timer.set
    (
        re.compile(
            r"(?:set (?:a )?)?timer (?:for )?(\d+)\s*(s|sec|seconds?|m|min|minutes?|h|hr|hours?)",
            re.I,
        ),
        "timer.set",
    ),
    (
        re.compile(
            r"remind me in (\d+)\s*(s|m|h|min|sec|hour|minute)s?\s*(?:to\s+.+)?",
            re.I,
        ),
        "timer.set",
    ),

    # task.status
    (re.compile(rf"task\s+status\s+{_UUID_PAT}", re.I), "task.status"),
    (re.compile(rf"(?:check|show|get)\s+(?:the\s+)?status\s+of\s+task\s+{_UUID_PAT}", re.I), "task.status"),

    # task.cancel
    (re.compile(rf"cancel\s+task\s+{_UUID_PAT}", re.I), "task.cancel"),
    (re.compile(rf"stop\s+task\s+{_UUID_PAT}", re.I), "task.cancel"),

    # autonomy.set
    (re.compile(r"set\s+autonomy\s+(?:level\s+)?(?:to\s+)?A[0-4]\b", re.I), "autonomy.set"),
    (re.compile(r"autonomy\s+level\s+(?:to\s+)?A[0-4]\b", re.I), "autonomy.set"),

    # approval.list
    (re.compile(r"list\s+(?:all\s+|pending\s+)?approvals?", re.I), "approval.list"),
    (re.compile(r"show\s+(?:all\s+|pending\s+)?approvals?", re.I), "approval.list"),

    # approval.approve
    (re.compile(rf"approve\s+(?:approval\s+|request\s+)?{_UUID_PAT}", re.I), "approval.approve"),

    # approval.deny
    (re.compile(rf"(?:deny|reject)\s+(?:approval\s+|request\s+)?{_UUID_PAT}", re.I), "approval.deny"),

    # schedule.list
    (re.compile(r"list\s+(?:all\s+)?schedules?", re.I), "schedule.list"),
    (re.compile(r"show\s+(?:all\s+)?schedules?", re.I), "schedule.list"),

    # schedule.cancel — accepts UUID or named slug
    (re.compile(rf"cancel\s+schedule\s+{_IDENT_PAT}", re.I), "schedule.cancel"),
    (re.compile(rf"(?:delete|remove)\s+schedule\s+{_IDENT_PAT}", re.I), "schedule.cancel"),

    # schedule.pause
    (re.compile(rf"pause\s+schedule\s+{_IDENT_PAT}", re.I), "schedule.pause"),

    # rule.list
    (re.compile(r"list\s+(?:all\s+)?rules?", re.I), "rule.list"),
    (re.compile(r"show\s+(?:all\s+)?rules?", re.I), "rule.list"),

    # rule.enable — accepts UUID or named slug
    (re.compile(rf"enable\s+rule\s+{_IDENT_PAT}", re.I), "rule.enable"),

    # rule.disable
    (re.compile(rf"disable\s+rule\s+{_IDENT_PAT}", re.I), "rule.disable"),
]


class Router:
    """Routes a MessageEvent to a handler.

    Routing cascade:
    1. Regex match on event.content → fastpath handler (no LLM, low latency)
    2. Everything else → "llm_conversation" (LLM picks a tool from the registry)
    """

    def __init__(self, audit: AuditWriter) -> None:
        self._audit = audit

    async def route(self, event: MessageEvent) -> RouteDecision:
        handler, reason = self._resolve_handler(event)

        decision = RouteDecision(
            event_id=event.event_id,
            trace_id=event.trace_id,
            handler=handler,
            reason=reason,
        )

        await self._audit.emit(
            event.trace_id,
            stage="route",
            type="routing.decided",
            summary=f"MessageEvent {event.event_id} routed to '{handler}': {reason}",
            outcome="info",
            ref_event_id=event.event_id,
        )

        logger.info("event.routed event_id=%s handler=%s", event.event_id, handler)
        return decision

    def _resolve_handler(self, event: MessageEvent) -> tuple[str, str]:
        for pattern, handler_key in _FASTPATH:
            if pattern.search(event.content):
                return handler_key, "fastpath: pattern match"
        return "llm_conversation", "no fastpath match — LLM conversation"
