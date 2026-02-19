from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.date import DateTrigger

from syris_core.types.task import AlarmAutomation, TimerAutomation, TriggerType
from syris_core.types.llm import ScheduleSetArgs
from syris_core.util.helpers import resolve_run_at


def build_trigger(*, args: ScheduleSetArgs, now: datetime, tz: ZoneInfo) -> TriggerType:
    if args.time_expression is not None:
        run_at = resolve_run_at(time_expression=args.time_expression, now=now, tz=tz)
        return DateTrigger(run_date=run_at)

    if args.cron is not None:
        minute, hour, day, month, day_of_week = args.cron.split()

        return CronTrigger(
            minute=minute,
            hour=hour,
            day=day,
            month=month,
            day_of_week=day_of_week,
            timezone=tz,
        )

    if args.delay_seconds is not None:
        return DateTrigger(run_date=now + timedelta(seconds=args.delay_seconds))

    if args.run_at is not None:
        return DateTrigger(run_date=args.run_at)

    raise ValueError("No scheduling info provided.")


def build_automation(*, args: ScheduleSetArgs, trigger: TriggerType):
    common = dict(id=args.id, trigger=trigger, label=args.label)

    if args.kind == "alarm":
        return AlarmAutomation(mode="alarm", **common)

    if args.kind == "timer":
        return TimerAutomation(mode="timer", **common)

    raise ValueError(f"Unknown automation kind: {args.kind!r}")
