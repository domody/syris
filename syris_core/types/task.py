from typing import Any, Dict, Literal, Union, Optional
from pydantic import BaseModel, ConfigDict
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.date import DateTrigger

from syris_core.types.llm import Plan

TriggerType = Union[CronTrigger, DateTrigger]

class AutomationBase(BaseModel):
    id: str
    trigger: TriggerType

    model_config = ConfigDict(
        arbitrary_types_allowed=True
    )

class PromptAutomation(AutomationBase):
    mode: Literal["prompt"]
    text: str

class PlanAutomation(AutomationBase):
    mode: Literal["plan"]
    plan: Plan

class TimerAutomation(AutomationBase):
    mode: Literal["timer"]
    label: Optional[str] = None

class AlarmAutomation(AutomationBase):
    mode: Literal["alarm"]
    label: Optional[str] = None

    # message, priority, repeat, requires acknoledgment, on acknoledgement? idk 
    
Automation = Union[PromptAutomation, PlanAutomation, TimerAutomation, AlarmAutomation]