from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import ScheduleRow


class ScheduleRepo:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, row: ScheduleRow) -> ScheduleRow:
        self._session.add(row)
        await self._session.flush()
        return row

    async def get(self, schedule_id: UUID) -> Optional[ScheduleRow]:
        result = await self._session.get(ScheduleRow, schedule_id)
        return result

    async def list_all(self) -> list[ScheduleRow]:
        result = await self._session.execute(select(ScheduleRow))
        return list(result.scalars().all())

    async def get_due(self, now: datetime) -> list[ScheduleRow]:
        """Return enabled schedules whose next_run_at <= now, locked for update."""
        stmt = (
            select(ScheduleRow)
            .where(ScheduleRow.enabled == True)  # noqa: E712
            .where(ScheduleRow.next_run_at != None)  # noqa: E711
            .where(ScheduleRow.next_run_at <= now)
            .with_for_update(skip_locked=True)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def update_fields(self, schedule_id: UUID, **fields: Any) -> Optional[ScheduleRow]:
        fields["updated_at"] = datetime.now(timezone.utc)
        stmt = (
            update(ScheduleRow)
            .where(ScheduleRow.schedule_id == schedule_id)
            .values(**fields)
            .returning(ScheduleRow)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()
