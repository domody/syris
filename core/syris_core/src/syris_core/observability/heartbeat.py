import asyncio
from dataclasses import dataclass
from datetime import datetime, timezone
import logging
import uuid
from typing import Callable, Optional

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from syris_core.storage.db import session_scope
from syris_core.storage.models import SystemHeartbeatRow

logger = logging.getLogger(__name__)

@dataclass(frozen=True)
class HeartbeatSnapshot:
    run_id: uuid.UUID
    started_at: datetime
    last_beat_at: datetime | None


class HeartbeatService:
    def __init__(
            self,
            session_maker: async_sessionmaker[AsyncSession],
            *,
            run_id: uuid.UUID,
            started_at: datetime,
            interval_s: int,
            service: str,
            version: str,
            status_provider: Optional[Callable[[], str]] =  None,
    ) -> None:
        self._session_maker = session_maker
        self._run_id = run_id
        self._started_at = started_at
        self._interval_s = interval_s
        self._service = service
        self._version = version
        self._status_provider = status_provider or (lambda: "healthy")

        self._stop_event = asyncio.Event()
        self._task: asyncio.Task[None] | None = None

        self._last_beat_at: datetime | None = None

    async def start(self) -> None:
        if self._task and not self._task.done():
            return
        
        self._stop_event.clear()
        self._task = asyncio.create_task(self._run_loop(), name="heartbeat_loop")
        logger.info("HeartbeatService started (interval=%ss)", self._interval_s)

    async def stop(self) -> None:
        if not self._task:
            return
        
        self._stop_event.set()
        self._task.cancel()
        try:
            await self._task
        except asyncio.CancelledError:
            pass
        finally:
            self._task = None

        logger.info("HeartbeatService stopped")

    def snapshot(self) -> HeartbeatSnapshot:
        return HeartbeatSnapshot(
            run_id=self._run_id,
            started_at=self._started_at,
            last_beat_at=self._last_beat_at,
        )
    
    async def _run_loop(self) -> None:
        try:
            while not self._stop_event.is_set():
                await self._write_heartbeat()

                try: 
                    await asyncio.wait_for(self._stop_event.wait(), timeout=self._interval_s)
                except asyncio.TimeoutError:
                    # normal, time to write another heartbeat
                    continue
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Heartbeat loop crashed")
            # TODO: emit an alarm + degrade health in later v.x.y

    async def _write_heartbeat(self) -> None:
        now = datetime.now(timezone.utc)
        uptime_s = int((now - self._started_at).total_seconds())

        row = SystemHeartbeatRow(
            run_id=self._run_id,
            ts = now,
            status = self._status_provider(),
            uptime_s=uptime_s,
            service=self._service,
            version=self._version,
        )

        async with session_scope(self._session_maker) as session:
            session.add(row)

        self._last_beat_at = now