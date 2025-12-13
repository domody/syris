from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.date import DateTrigger
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta

AUTOMATIONS = [
    {
        "id": "daily_system_summary",
        "trigger": CronTrigger(hour=9, minute=0),
        "text": "Generate the daily system diagnostic summary",
    },
    {
        "id": "hourly_health_check",
        "trigger": CronTrigger(minute=0),
        "text": "Run a quick system health check",
    },

        {
        "id": "dev_startup_test",
        "trigger": DateTrigger(
            run_date=datetime.now() + timedelta(seconds=10)
        ),
        "text": "Run a quick system health check",
    },

    {
        "id": "dev_interval_test",
        "trigger": IntervalTrigger(seconds=30),
        "text": "Generate a lightweight system diagnostic",
    },

]