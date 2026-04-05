import logging
from typing import Any, Callable, Coroutine, Optional

from ..llm.client import LLMClient
from ..observability.audit import AuditWriter
from ..schemas.events import MessageEvent
from ..schemas.pipeline import ExecutionResult, RouteDecision

logger = logging.getLogger(__name__)

# Optional hook for dispatching a reply back to the originating channel.
# Signature: (event, response_text) → None. Injected at construction time;
# when absent the response is generated but not dispatched externally.
DispatchHook = Callable[[MessageEvent, str], Coroutine[Any, Any, None]]


class Responder:
    """Generates an LLM reply and emits a response.sent audit event.

    Returns the reply text so the caller can include it in the HTTP response.
    Returns None for silent-mode events.

    An optional *dispatch* hook can be injected to send the reply back to
    the originating channel (e.g. a Slack adapter). Without it the reply is
    returned to the caller and audited but not forwarded anywhere externally.
    """

    def __init__(
        self,
        client: LLMClient,
        audit: AuditWriter,
        dispatch: Optional[DispatchHook] = None,
    ) -> None:
        self._client = client
        self._audit = audit
        self._dispatch = dispatch

    async def respond(
        self,
        event: MessageEvent,
        decision: RouteDecision,
        result: ExecutionResult,
    ) -> Optional[str]:
        """Compose and (optionally) dispatch a reply.

        Returns the reply text when a reply is generated, or None for
        silent-mode events.
        """
        if decision.response_mode == "silent":
            return None

        if decision.response_mode == "passthrough":
            reply = result.detail
        else:
            llm_response = await self._client.respond(event, decision, result)
            reply = llm_response.content

        if self._dispatch is not None:
            await self._dispatch(event, reply)

        await self._audit.emit(
            event.trace_id,
            stage="llm",
            type="response.sent",
            summary=(
                f"Response sent for event {event.event_id} "
                f"via {event.source}: {reply[:80]!r}"
            ),
            outcome="success",
            ref_event_id=event.event_id,
        )

        logger.info(
            "response.sent event_id=%s source=%s len=%d",
            event.event_id,
            event.source,
            len(reply),
        )
        return reply
