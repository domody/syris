import logging
from typing import Any, Callable, Coroutine, Optional

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ..llm.client import LLMClient
from ..observability.audit import AuditWriter
from ..schemas.events import MessageEvent
from ..schemas.pipeline import ExecutionResult
from ..storage.db import session_scope
from ..storage.repos.events import EventRepo

logger = logging.getLogger(__name__)

DispatchHook = Callable[[MessageEvent, str], Coroutine[Any, Any, None]]


class Responder:
    """Generates an LLM reply and emits a response.sent audit event.

    Single termination point for all chat-origin events. Always calls
    client.chat() with full thread history; passes the execution result
    when one exists so the LLM can reference what the system just did.
    Persists the reply as a MessageEvent for conversation continuity.
    """

    def __init__(
        self,
        client: LLMClient,
        audit: AuditWriter,
        session_maker: async_sessionmaker[AsyncSession],
        dispatch: Optional[DispatchHook] = None,
    ) -> None:
        self._client = client
        self._audit = audit
        self._session_maker = session_maker
        self._dispatch = dispatch

    async def respond(
        self,
        event: MessageEvent,
        result: ExecutionResult,
    ) -> str:
        """Compose, persist, and (optionally) dispatch a reply."""
        llm_response = await self._client.chat(event, result=result)

        reply = llm_response.content

        reply_event = MessageEvent(
            trace_id=event.trace_id,
            thread_id=event.thread_id,
            source="llm",
            content=reply,
            parent_event_id=event.event_id,
        )
        async with session_scope(self._session_maker) as session:
            await EventRepo(session).create(reply_event)

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
