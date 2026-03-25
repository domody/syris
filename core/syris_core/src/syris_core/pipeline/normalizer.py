import logging
from typing import Any
from uuid import uuid4

from ..observability.audit import AuditWriter
from ..schemas.events import MessageEvent, RawInput

logger = logging.getLogger(__name__)


class Normalizer:
    """Converts a RawInput into a canonical MessageEvent and emits an audit event."""

    def __init__(self, audit: AuditWriter) -> None:
        self._audit = audit

    async def normalize(self, raw: RawInput) -> MessageEvent:
        trace_id = raw.trace_id or uuid4()

        content: str
        structured: dict[str, Any]
        if isinstance(raw.content, dict):
            content = ""
            structured = raw.content
        else:
            content = raw.content
            structured = {}

        event = MessageEvent(
            trace_id=trace_id,
            source=raw.source,
            content=content,
            structured=structured,
            content_type=raw.content_type,
            idempotency_key=raw.idempotency_key,
        )

        await self._audit.emit(
            trace_id,
            stage="normalize",
            type="event.ingested",
            summary=f"MessageEvent {event.event_id} ingested from {event.source}",
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
