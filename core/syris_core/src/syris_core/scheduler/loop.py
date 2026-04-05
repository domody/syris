"""Scheduler loop: fires MessageEvents for due schedules.

Supports three schedule types:
- cron: standard cron expression evaluated with croniter
- interval: fires every N seconds from last_run_at (or now if never run)
- one_shot: fires once at run_at, then self-disables

Catch-up policies (applied when a schedule is overdue):
- skip: advance to next slot, log one audit event per skipped occurrence
- run_once: fire once for the entire missed window
- run_all_capped: fire up to catch_up_max times; skip remaining
"""

import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Callable, Coroutine, Optional, Any

from croniter import croniter
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ..observability.audit import AuditWriter
from ..schemas.events import MessageEvent, RawInput
from ..storage.db import session_scope
from ..storage.models import ScheduleRow
from ..storage.repos.schedules import ScheduleRepo

logger = logging.getLogger(__name__)

# Type alias for the pipeline callable
PipelineRunner = Callable[[RawInput], Coroutine[Any, Any, Any]]

_POLL_INTERVAL_S = 5


def compute_initial_next_run(
    schedule_type: str,
    *,
    interval_s: Optional[int] = None,
    run_at: Optional[datetime] = None,
    cron_expr: Optional[str] = None,
    now: Optional[datetime] = None,
) -> Optional[datetime]:
    """Compute next_run_at for a newly created schedule.

    Must be called at creation time so the scheduler's get_due() query
    (which filters WHERE next_run_at IS NOT NULL) can find the row.

    - interval  → now (fire on the very next scheduler tick)
    - one_shot  → run_at
    - cron      → first occurrence after now per cron_expr
    """
    _now = now or datetime.now(timezone.utc)
    if schedule_type == "interval":
        return _now
    if schedule_type == "one_shot":
        return run_at
    if schedule_type == "cron":
        if not cron_expr:
            return None
        try:
            return croniter(cron_expr, _now).get_next(datetime)
        except Exception:
            logger.exception("croniter error computing initial next_run for expr=%s", cron_expr)
            return None
    return None


class SchedulerLoop:
    """Polls for due schedules and fires MessageEvents through the pipeline."""

    def __init__(
        self,
        sessionmaker: async_sessionmaker[AsyncSession],
        audit_writer: AuditWriter,
        pipeline_runner: PipelineRunner,
    ) -> None:
        self._sessionmaker = sessionmaker
        self._audit = audit_writer
        self._pipeline_runner = pipeline_runner
        self._stop_event = asyncio.Event()
        self._task: asyncio.Task[None] | None = None

    async def start(self) -> None:
        if self._task and not self._task.done():
            return
        self._stop_event.clear()
        self._task = asyncio.create_task(self._run_loop(), name="scheduler_loop")
        logger.info("SchedulerLoop started (poll_interval=%ss)", _POLL_INTERVAL_S)

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
        logger.info("SchedulerLoop stopped")

    async def _run_loop(self) -> None:
        try:
            while not self._stop_event.is_set():
                try:
                    await self._tick()
                except Exception:
                    logger.exception("SchedulerLoop tick error")

                try:
                    await asyncio.wait_for(self._stop_event.wait(), timeout=_POLL_INTERVAL_S)
                except asyncio.TimeoutError:
                    continue
        except asyncio.CancelledError:
            raise

    async def _tick(self) -> None:
        now = datetime.now(timezone.utc)
        async with session_scope(self._sessionmaker) as session:
            repo = ScheduleRepo(session)
            due = await repo.get_due(now)
            for row in due:
                await self._process_schedule(repo, row, now)

    async def _process_schedule(
        self, repo: ScheduleRepo, row: ScheduleRow, now: datetime
    ) -> None:
        trace_id = uuid.uuid4()

        # Determine how many fires are needed (catch-up)
        fire_times = self._compute_fire_times(row, now)

        if not fire_times:
            # No fires needed — advance next_run_at and skip
            next_run = self._compute_next_run(row, now)
            await repo.update_fields(
                row.schedule_id,
                next_run_at=next_run,
                enabled=False if row.schedule_type == "one_shot" else row.enabled,
            )
            return

        fires_to_run = fire_times
        skipped = 0

        if row.catch_up_policy == "skip":
            # Only fire the most recent slot
            fires_to_run = [fire_times[-1]]
            skipped = len(fire_times) - 1
        elif row.catch_up_policy == "run_once":
            fires_to_run = [fire_times[-1]]
            skipped = len(fire_times) - 1
        elif row.catch_up_policy == "run_all_capped":
            cap = row.catch_up_max or 1
            fires_to_run = fire_times[:cap]
            skipped = max(0, len(fire_times) - cap)

        if skipped > 0:
            await self._audit.emit(
                trace_id,
                stage="scheduler",
                type="schedule.slots_skipped",
                summary=(
                    f"Schedule {row.name} ({row.schedule_id}) skipped {skipped} "
                    f"missed slot(s) per catch_up_policy={row.catch_up_policy}"
                ),
                outcome="suppressed",
                connector_id=str(row.schedule_id),
            )

        for fire_at in fires_to_run:
            await self._fire(row, fire_at, trace_id)

        # Compute next run after last fire
        last_fire = fires_to_run[-1]
        next_run = self._compute_next_run(row, last_fire)

        update_kwargs: dict[str, Any] = {
            "last_run_at": last_fire,
            "next_run_at": next_run,
            "fire_count": row.fire_count + len(fires_to_run),
        }
        if row.schedule_type == "one_shot":
            update_kwargs["enabled"] = False
            update_kwargs["next_run_at"] = None

        await repo.update_fields(row.schedule_id, **update_kwargs)

    async def _fire(self, row: ScheduleRow, fire_at: datetime, trace_id: uuid.UUID) -> None:
        """Emit one MessageEvent and an audit record for this schedule firing."""
        await self._audit.emit(
            trace_id,
            stage="scheduler",
            type="schedule.fired",
            summary=f"Schedule {row.name} ({row.schedule_id}) fired at {fire_at.isoformat()}",
            outcome="info",
            connector_id=str(row.schedule_id),
        )

        raw = RawInput(
            source=row.event_source,
            content=row.event_structured if row.event_structured else row.event_content,
            trace_id=trace_id,
        )

        try:
            await self._pipeline_runner(raw)
        except Exception:
            logger.exception(
                "Pipeline error after schedule fire schedule_id=%s", row.schedule_id
            )
            await self._audit.emit(
                trace_id,
                stage="scheduler",
                type="schedule.pipeline_error",
                summary=f"Pipeline error after schedule {row.name} fired",
                outcome="failure",
                connector_id=str(row.schedule_id),
            )

    def _compute_fire_times(self, row: ScheduleRow, now: datetime) -> list[datetime]:
        """Return the list of datetimes that should fire, from last_run_at to now."""
        if row.schedule_type == "cron":
            return self._cron_fire_times(row, now)
        elif row.schedule_type == "interval":
            return self._interval_fire_times(row, now)
        elif row.schedule_type == "one_shot":
            # run_at is next_run_at for one-shot; only fire once
            if row.next_run_at and row.next_run_at <= now:
                return [row.next_run_at]
            return []
        return []

    def _cron_fire_times(self, row: ScheduleRow, now: datetime) -> list[datetime]:
        if not row.cron_expr:
            return []
        start = row.last_run_at or now
        try:
            cron = croniter(row.cron_expr, start)
            times: list[datetime] = []
            while True:
                t = cron.get_next(datetime)
                if t > now:
                    break
                times.append(t)
            return times
        except Exception:
            logger.exception("croniter error for expr=%s", row.cron_expr)
            return []

    def _interval_fire_times(self, row: ScheduleRow, now: datetime) -> list[datetime]:
        if not row.interval_s:
            return []
        start = row.last_run_at
        if start is None:
            # Never run — fire once now
            return [now]
        from datetime import timedelta
        interval = timedelta(seconds=row.interval_s)
        times: list[datetime] = []
        t = start + interval
        while t <= now:
            times.append(t)
            t += interval
        return times

    def _compute_next_run(self, row: ScheduleRow, after: datetime) -> Optional[datetime]:
        """Compute the next scheduled fire time after `after`."""
        if row.schedule_type == "cron":
            if not row.cron_expr:
                return None
            try:
                cron = croniter(row.cron_expr, after)
                return cron.get_next(datetime)
            except Exception:
                logger.exception("croniter error computing next_run for expr=%s", row.cron_expr)
                return None
        elif row.schedule_type == "interval":
            if not row.interval_s:
                return None
            from datetime import timedelta
            return after + timedelta(seconds=row.interval_s)
        elif row.schedule_type == "one_shot":
            return None
        return None
