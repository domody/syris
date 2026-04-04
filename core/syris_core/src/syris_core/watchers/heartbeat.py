"""HeartbeatWatcher: reference watcher implementation.

Writes SystemHealth records directly to the database on each tick.
Returns no MessageEvents (the heartbeat is infrastructure telemetry,
not something that should be routed through the pipeline).
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ..schemas.events import RawInput
from ..storage.db import session_scope
from ..storage.models import SystemHeartbeatRow, WatcherStateRow
from .base import BaseWatcher


class HeartbeatWatcher(BaseWatcher):
    """Writes a SystemHealth row on every tick."""

    def __init__(
        self,
        sessionmaker: async_sessionmaker[AsyncSession],
        run_id: uuid.UUID,
        started_at: datetime,
        service: str,
        version: str,
        tick_interval_s: int = 30,
    ) -> None:
        self._sessionmaker = sessionmaker
        self._run_id = run_id
        self._started_at = started_at
        self._service = service
        self._version = version
        self._tick_interval_s = tick_interval_s

    @property
    def watcher_id(self) -> str:
        return "heartbeat"

    @property
    def tick_interval_seconds(self) -> int:
        return self._tick_interval_s

    async def tick(self, state: WatcherStateRow) -> list[RawInput]:
        now = datetime.now(timezone.utc)
        uptime_s = int((now - self._started_at).total_seconds())

        row = SystemHeartbeatRow(
            run_id=self._run_id,
            ts=now,
            status="healthy",
            uptime_s=uptime_s,
            service=self._service,
            version=self._version,
        )

        async with session_scope(self._sessionmaker) as session:
            session.add(row)

        return []
