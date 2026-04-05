"""HeartbeatWatcher: monitors SystemHeartbeatRow for missed beats.

On each tick, queries the latest heartbeat row for this run_id and
compares its timestamp to now. If the gap exceeds the missed-beat
threshold, injects a RawInput alarm event into the pipeline.
HeartbeatService owns all writes to SystemHeartbeatRow — this watcher
never writes to that table.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ..schemas.events import RawInput
from ..storage.db import session_scope
from ..storage.models import SystemHeartbeatRow, WatcherStateRow
from .base import BaseWatcher

_MISSED_BEAT_MULTIPLIER = 2.5


class HeartbeatWatcher(BaseWatcher):
    """Monitors SystemHeartbeatRow and fires an alarm when beats are missed."""

    def __init__(
        self,
        sessionmaker: async_sessionmaker[AsyncSession],
        run_id: uuid.UUID,
        tick_interval_s: int = 30,
    ) -> None:
        self._sessionmaker = sessionmaker
        self._run_id = run_id
        self._tick_interval_s = tick_interval_s

    @property
    def watcher_id(self) -> str:
        return "heartbeat"

    @property
    def tick_interval_seconds(self) -> int:
        return self._tick_interval_s

    async def tick(self, state: WatcherStateRow) -> list[RawInput]:
        now = datetime.now(timezone.utc)
        threshold_s = _MISSED_BEAT_MULTIPLIER * self._tick_interval_s

        async with session_scope(self._sessionmaker) as session:
            result = await session.execute(
                select(SystemHeartbeatRow)
                .where(SystemHeartbeatRow.run_id == self._run_id)
                .order_by(SystemHeartbeatRow.ts.desc())
                .limit(1)
            )
            latest: SystemHeartbeatRow | None = result.scalar_one_or_none()

        if latest is None:
            gap_s: float | None = None
        else:
            gap_s = (now - latest.ts).total_seconds()

        if gap_s is not None and gap_s <= threshold_s:
            return []

        # Bucket the idempotency key so repeated ticks within the same window
        # don't re-fire duplicate alarms.
        bucket = int(now.timestamp()) // self._tick_interval_s

        return [
            RawInput(
                source="watcher.heartbeat",
                content={
                    "alarm": "heartbeat.missed",
                    "run_id": str(self._run_id),
                    "gap_s": gap_s,
                    "threshold_s": threshold_s,
                    "last_beat_at": latest.ts.isoformat() if latest is not None else None,
                    "detected_at": now.isoformat(),
                },
                content_type="application/json",
                trace_id=uuid.uuid4(),
                idempotency_key=f"heartbeat.missed.{self._run_id}.{bucket}",
            )
        ]
