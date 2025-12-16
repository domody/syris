import time
import asyncio

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from syris_core.automation.automations import AUTOMATIONS
from syris_core.types.events import Event, EventType
from syris_core.types.task import Automation
from syris_core.events.bus import EventBus
from syris_core.util.logger import log


class AutomationScheduler:
    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus
        self.scheduler = AsyncIOScheduler(event_loop=asyncio.get_running_loop())

    def start(self):
        for automation in AUTOMATIONS:
            self.register(automation=automation)

        self.scheduler.start()

    async def _emit_automation_event(self, automation: Automation):
        event = Event(
            type=EventType.SCHEDULE,
            payload={"automation": automation},
            timestamp=time.time(),
        )
        log("scheduler", f"Automation fired: {automation.id}")

        await self.event_bus.publish(event)

    def register(self, automation: Automation):
        self.scheduler.add_job(
            func=self._emit_automation_event,
            trigger=automation.trigger,
            kwargs={"automation": automation},
            id=automation.id,
            replace_existing=True,
        )

    def remove(self, automation_id: str):
        self.scheduler.remove_job(job_id=automation_id)

    def shutdown(self):
        self.scheduler.shutdown()
