from datetime import datetime, timedelta
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.date import DateTrigger

from syris_core.types.task import (
    Automation,
    PromptAutomation,
    PlanAutomation,
    TimerAutomation,
    AlarmAutomation,
)
from syris_core.types.llm import Plan, PlanStep

SYSTEM_DIAGNOSTIC_PLAN = Plan(
    name="Generate System Diagnostic Report",
    steps=[
        PlanStep(id="get_date", tool="system.get_date", arguments={}),
        PlanStep(id="get_time", tool="system.get_time", arguments={}),
        PlanStep(id="get_uptime", tool="system.get_uptime", arguments={}),
        PlanStep(id="get_os_info", tool="system.get_os_info", arguments={}),
        PlanStep(id="get_cpu_usage", tool="hardware.get_cpu_usage", arguments={}),
        PlanStep(id="get_disk_usage", tool="hardware.get_disk_usage", arguments={}),
        PlanStep(id="get_memory_usage", tool="hardware.get_memory_usage", arguments={}),
    ],
)

AUTOMATIONS: list[Automation] = [
    PlanAutomation(
        id="daily_system_summary",
        trigger=CronTrigger(hour=9, minute=0),
        mode="plan",
        plan=SYSTEM_DIAGNOSTIC_PLAN,
    ),
    # PlanAutomation(
    #     id="dev_startup_diagnostic",
    #     trigger=DateTrigger(run_date=datetime.now() + timedelta(seconds=10)),
    #     mode="plan",
    #     plan=SYSTEM_DIAGNOSTIC_PLAN,
    # ),
    TimerAutomation(
        id="dev_startup_timer",
        trigger=DateTrigger(run_date=datetime.now() + timedelta(seconds=3)),
        mode="timer",
    ),
    AlarmAutomation(
        id="dev_startup_alarm",
        trigger=DateTrigger(run_date=datetime.now() + timedelta(seconds=6)),
        mode="alarm",
    ),
]
