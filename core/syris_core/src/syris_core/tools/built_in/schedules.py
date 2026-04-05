"""Built-in schedule tools."""
import logging
from datetime import datetime, timezone
from typing import ClassVar, Literal, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field

from ...scheduler.loop import compute_initial_next_run
from ...storage.db import session_scope
from ...storage.models import ScheduleRow
from ...storage.repos.schedules import ScheduleRepo
from ..base import BaseTool, RiskLevel, ToolDeps, ToolResult

logger = logging.getLogger(__name__)


class ScheduleCreateArgs(BaseModel):
    name: Optional[str] = Field(None, description="Human name for the schedule")
    schedule_type: Literal["interval", "one_shot", "cron"] = Field(
        "interval", description="Firing strategy: interval, one_shot, or cron"
    )
    cron_expr: Optional[str] = Field(None, description="Cron expression (cron type only)")
    interval_s: Optional[int] = Field(None, description="Interval in seconds (interval type only)")
    run_at: Optional[datetime] = Field(None, description="One-shot fire time (ISO 8601)")
    timezone: str = Field("UTC", description="IANA timezone name")
    catch_up_policy: Literal["skip", "run_once", "run_all"] = Field(
        "skip", description="What to do if a firing is missed"
    )
    event_source: str = Field("schedule", description="Source tag on the emitted event")
    event_content: str = Field("", description="Content of the event fired by the schedule")
    event_structured: dict = Field(default_factory=dict)


class ScheduleCreateTool(BaseTool):
    name: ClassVar[str] = "schedule.create"
    description: ClassVar[str] = (
        "Create a schedule that fires events at a fixed interval, "
        "on a cron expression, or at a specific one-shot time."
    )
    args_schema: ClassVar[type[BaseModel]] = ScheduleCreateArgs
    risk_level: ClassVar[RiskLevel] = "low"
    idempotent: ClassVar[bool] = False

    async def execute(self, args: ScheduleCreateArgs) -> ToolResult:  # type: ignore[override]
        schedule_id = uuid4()
        now = datetime.now(timezone.utc)
        next_run_at = compute_initial_next_run(
            args.schedule_type,
            interval_s=args.interval_s,
            run_at=args.run_at,
            cron_expr=args.cron_expr,
            now=now,
        )
        row = ScheduleRow(
            schedule_id=schedule_id,
            name=args.name or f"schedule-{schedule_id}",
            schedule_type=args.schedule_type,
            cron_expr=args.cron_expr,
            interval_s=args.interval_s,
            run_at=args.run_at,
            timezone=args.timezone,
            catch_up_policy=args.catch_up_policy,
            event_source=args.event_source,
            event_content=args.event_content,
            event_structured=args.event_structured,
            next_run_at=next_run_at,
        )
        async with session_scope(self._deps.session_maker) as session:
            await ScheduleRepo(session).create(row)
        return ToolResult(
            summary=f"Created schedule '{row.name}' ({args.schedule_type}) id={schedule_id}",
            data={"schedule_id": str(schedule_id), "name": row.name},
        )


class ScheduleListArgs(BaseModel):
    pass


class ScheduleListTool(BaseTool):
    name: ClassVar[str] = "schedule.list"
    description: ClassVar[str] = "List all configured schedules."
    args_schema: ClassVar[type[BaseModel]] = ScheduleListArgs
    risk_level: ClassVar[RiskLevel] = "low"
    idempotent: ClassVar[bool] = True

    async def execute(self, args: ScheduleListArgs) -> ToolResult:  # type: ignore[override]
        async with session_scope(self._deps.session_maker) as session:
            rows = await ScheduleRepo(session).list_all()
        names = [r.name for r in rows]
        return ToolResult(
            summary=f"{len(rows)} schedule(s)",
            data={"count": len(rows), "names": names},
        )


class ScheduleCancelArgs(BaseModel):
    schedule_id: UUID = Field(..., description="UUID of the schedule to cancel")


class ScheduleCancelTool(BaseTool):
    name: ClassVar[str] = "schedule.cancel"
    description: ClassVar[str] = "Disable (cancel) an existing schedule by ID."
    args_schema: ClassVar[type[BaseModel]] = ScheduleCancelArgs
    risk_level: ClassVar[RiskLevel] = "medium"
    idempotent: ClassVar[bool] = True

    async def execute(self, args: ScheduleCancelArgs) -> ToolResult:  # type: ignore[override]
        async with session_scope(self._deps.session_maker) as session:
            await ScheduleRepo(session).update_fields(args.schedule_id, enabled=False)
        return ToolResult(
            summary=f"Cancelled schedule {args.schedule_id}",
            data={"schedule_id": str(args.schedule_id)},
        )


class SchedulePauseArgs(BaseModel):
    schedule_id: UUID = Field(..., description="UUID of the schedule to pause")


class SchedulePauseTool(BaseTool):
    name: ClassVar[str] = "schedule.pause"
    description: ClassVar[str] = "Pause a schedule (disables it without deleting)."
    args_schema: ClassVar[type[BaseModel]] = SchedulePauseArgs
    risk_level: ClassVar[RiskLevel] = "medium"
    idempotent: ClassVar[bool] = True

    async def execute(self, args: SchedulePauseArgs) -> ToolResult:  # type: ignore[override]
        async with session_scope(self._deps.session_maker) as session:
            await ScheduleRepo(session).update_fields(args.schedule_id, enabled=False)
        return ToolResult(
            summary=f"Paused schedule {args.schedule_id}",
            data={"schedule_id": str(args.schedule_id)},
        )
