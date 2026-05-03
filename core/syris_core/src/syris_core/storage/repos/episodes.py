"""MemoryEpisode repository — data access only, no business logic."""
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import MemoryEpisodeRow
from ...schemas.memory import EpisodeRecord


class EpisodeRepo:
    """Thin data-access wrapper for the memory_episodes table."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, record: EpisodeRecord) -> MemoryEpisodeRow:
        row = MemoryEpisodeRow(
            id=record.id,
            covers_from=record.covers_from,
            covers_to=record.covers_to,
            content=record.content,
            topics=record.topics,
            tools_invoked=record.tools_invoked,
            outcome_summary=record.outcome_summary,
            source_event_ids=record.source_event_ids,
            event_count=record.event_count,
            semantic_processed_at=record.semantic_processed_at,
            created_at=record.created_at,
        )
        self._session.add(row)
        await self._session.flush()
        return row

    async def list_recent(self, limit: int = 5) -> list[MemoryEpisodeRow]:
        """Return most recent episodes, newest first."""
        stmt = (
            select(MemoryEpisodeRow)
            .order_by(MemoryEpisodeRow.covers_to.desc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def list_unprocessed_for_semantic(
        self, limit: int = 20
    ) -> list[MemoryEpisodeRow]:
        """Return episodes not yet processed by the semantic worker, oldest first."""
        stmt = (
            select(MemoryEpisodeRow)
            .where(MemoryEpisodeRow.semantic_processed_at.is_(None))
            .order_by(MemoryEpisodeRow.covers_to.asc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())
