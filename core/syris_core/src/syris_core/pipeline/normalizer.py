import logging
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ..memory.significance import score_event
from ..observability.audit import AuditWriter
from ..schemas.events import MessageEvent, RawInput
from ..storage.db import session_scope
from ..storage.repos.events import EventRepo

logger = logging.getLogger(__name__)


class Normalizer:
    """Converts a RawInput into a canonical MessageEvent, persists it, and
    emits an audit event."""

    def __init__(
        self,
        audit: AuditWriter,
        session_maker: Optional[async_sessionmaker[AsyncSession]] = None,
    ) -> None:
        self._audit = audit
        self._session_maker = session_maker

    async def normalize(self, raw: RawInput) -> MessageEvent:
        from uuid import uuid4

        trace_id = raw.trace_id or uuid4()

        content: str
        structured: dict[str, Any]
        if isinstance(raw.content, dict):
            content = ""
            structured = raw.content
        else:
            content = raw.content
            structured = {}

        thread_id = raw.thread_id or trace_id

        event = MessageEvent(
            trace_id=trace_id,
            thread_id=thread_id,
            source=raw.source,
            content=content,
            structured=structured,
            content_type=raw.content_type,
            idempotency_key=raw.idempotency_key,
        )

        sig = score_event(event.content, event.source, event.structured)

        if self._session_maker is not None:
            async with session_scope(self._session_maker) as session:
                repo = EventRepo(session)
                await repo.create(event)
                await repo.update_significance(event.event_id, sig)

        await self._audit.emit(
            trace_id,
            stage="normalize",
            type="event.ingested",
            summary=f"MessageEvent {event.event_id} ingested from {event.source}",
            outcome="info",
            ref_event_id=event.event_id,
        )

        await self._audit.emit(
            trace_id,
            stage="memory",
            type="memory.scored",
            summary=(
                f"Scored event {event.event_id}: {sig.score:.2f} "
                f"tags=[{', '.join(sig.tags)}] anchor={sig.is_anchor}"
            ),
            outcome="info",
            ref_event_id=event.event_id,
        )

        logger.info(
            "event.ingested event_id=%s trace_id=%s source=%s",
            event.event_id,
            trace_id,
            event.source,
        )
        return event
