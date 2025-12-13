import time

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from syris_core.automation.automations import AUTOMATIONS
from syris_core.types.events import Event, EventType
from syris_core.events.bus import EventBus

class AutomationScheduler:
    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus
        self.scheduler = AsyncIOScheduler()

    def start(self):
        for automation in AUTOMATIONS:
            self.scheduler.add_job(
                func = self._emit_automation_event,
                trigger = automation["trigger"],
                kwargs = {
                    "automation_id": automation["id"],
                    "text": automation["text"]
                },
                id = automation["id"],
                replace_existing = True
            )

        self.scheduler.start()

    def shutdown(self):
        self.scheduler.shutdown()

    async def _emit_automation_event(self, automation_id: str, text: str):
        event = Event(
            type = EventType.SCHEDULE,
            payload = {
                "automation_id": automation_id,
                "text": text,
            },
            timestamp = time.time()
        )

        await self.event_bus.publish(event)