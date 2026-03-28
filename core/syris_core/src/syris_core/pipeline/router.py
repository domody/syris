import logging

from ..observability.audit import AuditWriter
from ..schemas.events import MessageEvent
from ..schemas.pipeline import RouteDecision

logger = logging.getLogger(__name__)

_UNROUTABLE = "unroutable"

class Router:
    """Routes a MessageEvent to a handler.

    Currently a stub — always routes to "unroutable".
    # TODO: evaluate rules engine first; LLM is fallback only (invariant #3)
    """

    def __init__(self, audit: AuditWriter) -> None:
        self._audit = audit

    async def route(self, event: MessageEvent) -> RouteDecision:
        handler = _UNROUTABLE
        reason = "no rule matched; defaulting to unroutable"
        response_mode = "llm_response"

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
            type="event.routed",
            summary=f"MessageEvent {event.event_id} routed to {handler}: {reason}",
            outcome="info",
            ref_event_id=event.event_id,
        )

        logger.info(
            "event.routed event_id=%s handler=%s", event.event_id, handler
        )
        return decision
