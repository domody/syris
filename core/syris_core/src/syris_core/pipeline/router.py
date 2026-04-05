import logging
import re

from ..observability.audit import AuditWriter
from ..schemas.events import MessageEvent
from ..schemas.pipeline import RouteDecision

logger = logging.getLogger(__name__)

# Fastpath patterns: regex → handler key.
# Only genuinely unambiguous, latency-sensitive patterns belong here.
# Everything else routes to "llm_conversation".
_FASTPATH: list[tuple[re.Pattern, str]] = [
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

        response_mode = "passthrough" if handler == "llm_conversation" else "llm_response"
        decision = RouteDecision(
            event_id=event.event_id,
            trace_id=event.trace_id,
            handler=handler,
            reason=reason,
            response_mode=response_mode,
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
