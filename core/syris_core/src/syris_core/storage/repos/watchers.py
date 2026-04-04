from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import WatcherStateRow


class WatcherStateRepo:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_or_create(self, watcher_id: str) -> WatcherStateRow:
        row = await self._session.get(WatcherStateRow, watcher_id)
        if row is None:
            row = WatcherStateRow(watcher_id=watcher_id)
            self._session.add(row)
            await self._session.flush()
        return row

    async def get(self, watcher_id: str) -> Optional[WatcherStateRow]:
        return await self._session.get(WatcherStateRow, watcher_id)

    async def list_all(self) -> list[WatcherStateRow]:
        result = await self._session.execute(select(WatcherStateRow))
        return list(result.scalars().all())

    async def update_fields(self, watcher_id: str, **fields: Any) -> Optional[WatcherStateRow]:
        fields["updated_at"] = datetime.now(timezone.utc)
        stmt = (
            update(WatcherStateRow)
            .where(WatcherStateRow.watcher_id == watcher_id)
            .values(**fields)
            .returning(WatcherStateRow)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()
