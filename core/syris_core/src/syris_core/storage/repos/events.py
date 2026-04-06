"""MessageEvent repository — data access only, no business logic."""
import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import MessageEventRow
from ...schemas.events import MessageEvent


class EventRepo:
    """Thin data-access wrapper for the message_events table."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, event: MessageEvent) -> MessageEventRow:
        """Persist a MessageEvent. Returns the inserted ORM row."""
        row = MessageEventRow(
            event_id=event.event_id,
            trace_id=event.trace_id,
            created_at=event.created_at,
            source=event.source,
            content=event.content,
            structured=event.structured,
            content_type=event.content_type,
            idempotency_key=event.idempotency_key,
            parent_event_id=event.parent_event_id,
        )
        self._session.add(row)
        await self._session.flush()
        return row

    async def get(self, event_id: uuid.UUID) -> Optional[MessageEventRow]:
        return await self._session.get(MessageEventRow, event_id)

    async def list_events(
        self,
        limit: int = 50,
        offset: int = 0,
        trace_id: Optional[uuid.UUID] = None,
    ) -> list[MessageEventRow]:
        stmt = select(MessageEventRow).order_by(MessageEventRow.created_at.desc())
        if trace_id is not None:
            stmt = stmt.where(MessageEventRow.trace_id == trace_id)
        stmt = stmt.offset(offset).limit(limit)
        result = await self._session.execute(stmt)
        return list(result.scalars().all())
