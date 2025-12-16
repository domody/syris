from syris_core.automation.scheduler import AutomationScheduler
from syris_core.types.task import (
    Automation,
    AlarmAutomation,
    Plan,
    PromptAutomation,
    TimerAutomation,
)


class SchedulingService:
    def __init__(self, scheduler: AutomationScheduler):
        self.scheduler = scheduler

    async def add_automation(self, automation: Automation):
        self.scheduler.register(automation=automation)

    async def cancel(self, schedule_id: str):
        self.scheduler.remove(automation_id=schedule_id)
