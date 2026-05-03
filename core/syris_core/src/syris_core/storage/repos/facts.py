"""MemoryFact repository — data access only, no business logic."""
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import MemoryFactRow
from ...schemas.memory import FactRecord


class FactRepo:
    """Thin data-access wrapper for the memory_facts table."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, record: FactRecord) -> MemoryFactRow:
        row = MemoryFactRow(
            id=record.id,
            category=record.category,
            key=record.key,
            value=record.value,
            confidence=record.confidence,
            is_anchor=record.is_anchor,
            source_episode_id=record.source_episode_id,
            superseded_by=record.superseded_by,
            created_at=record.created_at,
            updated_at=record.updated_at,
        )
        self._session.add(row)
        await self._session.flush()
        return row

    async def get_current_by_key(
        self, category: str, key: str
    ) -> Optional[MemoryFactRow]:
        """Return the active (non-superseded) fact for a given category+key."""
        stmt = (
            select(MemoryFactRow)
            .where(
                MemoryFactRow.category == category,
                MemoryFactRow.key == key,
                MemoryFactRow.superseded_by.is_(None),
            )
            .limit(1)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def supersede(self, old_id: uuid.UUID, new_fact: FactRecord) -> MemoryFactRow:
        """Mark old_id as superseded and insert the replacement fact."""
        now = datetime.now(timezone.utc)
        await self._session.execute(
            update(MemoryFactRow)
            .where(MemoryFactRow.id == old_id)
            .values(superseded_by=new_fact.id, updated_at=now)
        )
        return await self.create(new_fact)

    async def list_current(self) -> list[MemoryFactRow]:
        """Return all active (non-superseded) facts."""
        stmt = (
            select(MemoryFactRow)
            .where(MemoryFactRow.superseded_by.is_(None))
            .order_by(MemoryFactRow.category, MemoryFactRow.key)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def list_anchored(self) -> list[MemoryFactRow]:
        """Return all active anchored facts."""
        stmt = (
            select(MemoryFactRow)
            .where(
                MemoryFactRow.superseded_by.is_(None),
                MemoryFactRow.is_anchor.is_(True),
            )
            .order_by(MemoryFactRow.category, MemoryFactRow.key)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())
