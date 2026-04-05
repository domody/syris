"""BaseWatcher ABC and WatcherLoop orchestrator.

Watchers proactively monitor state and emit MessageEvents when conditions change.
The tick() method MUST be idempotent — safe to call repeatedly with the same state.

WatcherLoop:
1. Loads persisted WatcherStateRow for each registered watcher
2. Checks whether tick_interval_seconds has elapsed since last_tick_at
3. Calls tick() if due
4. Persists updated state and emits any returned MessageEvents through the pipeline
5. On failure: increments consecutive_errors, emits audit event
"""

import asyncio
import logging
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Callable, Coroutine, Any

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ..observability.audit import AuditWriter
from ..schemas.events import RawInput
from ..storage.db import session_scope
from ..storage.models import WatcherStateRow
from ..storage.repos.watchers import WatcherStateRepo

logger = logging.getLogger(__name__)

PipelineRunner = Callable[[RawInput], Coroutine[Any, Any, Any]]

_WATCHER_POLL_S = 5


class BaseWatcher(ABC):
    """Abstract base for all watcher implementations.

    Subclasses must define watcher_id and tick_interval_seconds and implement tick().
    """

    @property
    @abstractmethod
    def watcher_id(self) -> str:
        """Unique stable identifier for this watcher."""
        ...

    @property
    @abstractmethod
    def tick_interval_seconds(self) -> int:
        """How often (in seconds) this watcher should tick."""
        ...

    @abstractmethod
    async def tick(self, state: WatcherStateRow) -> list[RawInput]:
        """Execute one monitoring cycle.

        Must be idempotent. Returns a (possibly empty) list of RawInput events
        to inject into the pipeline. Return an empty list when no condition
        requires alerting.
        """
        ...


class WatcherLoop:
    """Drives all registered watchers on their configured tick intervals."""

    def __init__(
        self,
        sessionmaker: async_sessionmaker[AsyncSession],
        audit_writer: AuditWriter,
        pipeline_runner: PipelineRunner,
    ) -> None:
        self._sessionmaker = sessionmaker
        self._audit = audit_writer
        self._pipeline_runner = pipeline_runner
        self._watchers: dict[str, BaseWatcher] = {}
        self._stop_event = asyncio.Event()
        self._task: asyncio.Task[None] | None = None

    def register(self, watcher: BaseWatcher) -> None:
        self._watchers[watcher.watcher_id] = watcher

    async def start(self) -> None:
        # Ensure all watcher state rows exist in DB
        async with session_scope(self._sessionmaker) as session:
            repo = WatcherStateRepo(session)
            for watcher_id in self._watchers:
                await repo.get_or_create(watcher_id)

        if self._task and not self._task.done():
            return
        self._stop_event.clear()
        self._task = asyncio.create_task(self._run_loop(), name="watcher_loop")
        logger.info("WatcherLoop started with %d watcher(s)", len(self._watchers))

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
        logger.info("WatcherLoop stopped")

    async def _run_loop(self) -> None:
        try:
            while not self._stop_event.is_set():
                try:
                    await self._tick_all()
                except Exception:
                    logger.exception("WatcherLoop tick_all error")

                try:
                    await asyncio.wait_for(self._stop_event.wait(), timeout=_WATCHER_POLL_S)
                except asyncio.TimeoutError:
                    continue
        except asyncio.CancelledError:
            raise

    async def _tick_all(self) -> None:
        now = datetime.now(timezone.utc)
        for watcher in self._watchers.values():
            async with session_scope(self._sessionmaker) as session:
                repo = WatcherStateRepo(session)
                state = await repo.get_or_create(watcher.watcher_id)

                if not state.enabled:
                    continue

                if not self._is_due(state, watcher, now):
                    continue

                await self._run_watcher(repo, watcher, state, now)

    def _is_due(self, state: WatcherStateRow, watcher: BaseWatcher, now: datetime) -> bool:
        if state.last_tick_at is None:
            return True
        from datetime import timedelta
        elapsed = (now - state.last_tick_at).total_seconds()
        return elapsed >= watcher.tick_interval_seconds

    async def _run_watcher(
        self,
        repo: WatcherStateRepo,
        watcher: BaseWatcher,
        state: WatcherStateRow,
        now: datetime,
    ) -> None:
        trace_id = uuid.uuid4()
        try:
            raw_events = await watcher.tick(state)

            await repo.update_fields(
                watcher.watcher_id,
                last_tick_at=now,
                last_outcome="ok",
                consecutive_errors=0,
            )

            await self._audit.emit(
                trace_id,
                stage="watcher",
                type="watcher.ticked",
                summary=f"Watcher {watcher.watcher_id} ticked, {len(raw_events)} event(s) emitted",
                outcome="info",
                connector_id=watcher.watcher_id,
            )

            for raw in raw_events:
                try:
                    await self._pipeline_runner(raw)
                except Exception:
                    logger.exception(
                        "Pipeline error from watcher event watcher_id=%s", watcher.watcher_id
                    )

        except Exception:
            logger.exception("Watcher tick error watcher_id=%s", watcher.watcher_id)
            new_errors = state.consecutive_errors + 1
            await repo.update_fields(
                watcher.watcher_id,
                last_tick_at=now,
                last_outcome="error",
                consecutive_errors=new_errors,
            )
            await self._audit.emit(
                trace_id,
                stage="watcher",
                type="watcher.tick_error",
                summary=f"Watcher {watcher.watcher_id} tick failed (consecutive_errors={new_errors})",
                outcome="failure",
                connector_id=watcher.watcher_id,
            )
