"""MessageEvent repository — data access only, no business logic."""
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import MessageEventRow
from ...schemas.events import MessageEvent
from ...schemas.memory import SignificanceResult


class EventRepo:
    """Thin data-access wrapper for the message_events table."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, event: MessageEvent) -> MessageEventRow:
        """Persist a MessageEvent. Returns the inserted ORM row."""
        row = MessageEventRow(
            event_id=event.event_id,
            trace_id=event.trace_id,
            thread_id=event.thread_id,
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

    async def list_by_thread(
        self,
        thread_id: uuid.UUID,
        limit: int = 50,
    ) -> list[MessageEventRow]:
        """Return events in a thread, oldest first (chronological order)."""
        stmt = (
            select(MessageEventRow)
            .where(MessageEventRow.thread_id == thread_id)
            .order_by(MessageEventRow.created_at.asc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def update_significance(
        self,
        event_id: uuid.UUID,
        result: SignificanceResult,
    ) -> None:
        """Persist significance scoring output onto an existing event row."""
        stmt = (
            update(MessageEventRow)
            .where(MessageEventRow.event_id == event_id)
            .values(
                significance_score=result.score,
                significance_tags=result.tags,
                is_anchor=result.is_anchor,
                anchor_reason=result.anchor_reason,
            )
        )
        await self._session.execute(stmt)

    async def list_unprocessed_for_episodic(
        self,
        window_minutes: int,
        limit: int = 20,
    ) -> list[MessageEventRow]:
        """Return unprocessed events older than window_minutes, oldest first."""
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=window_minutes)
        stmt = (
            select(MessageEventRow)
            .where(
                MessageEventRow.memory_processed_at.is_(None),
                MessageEventRow.created_at < cutoff,
            )
            .order_by(MessageEventRow.created_at.asc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def mark_memory_processed(self, event_ids: list[uuid.UUID]) -> None:
        """Stamp memory_processed_at = now on a batch of events."""
        if not event_ids:
            return
        now = datetime.now(timezone.utc)
        stmt = (
            update(MessageEventRow)
            .where(MessageEventRow.event_id.in_(event_ids))
            .values(memory_processed_at=now)
        )
        await self._session.execute(stmt)

    async def list_anchored(self, limit: int = 50) -> list[MessageEventRow]:
        """Return anchor events, most recent first."""
        stmt = (
            select(MessageEventRow)
            .where(MessageEventRow.is_anchor.is_(True))
            .order_by(MessageEventRow.created_at.desc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())
