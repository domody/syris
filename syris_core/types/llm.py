from enum import Enum
from typing import Optional, Dict, Any, Literal, Union
from datetime import datetime
from pydantic import BaseModel, RootModel


class IntentType(str, Enum):
    CHAT = "chat"  # normal conversation, greetings, small talk
    QUERY = "query"  # ask for info (time, weather, definitions)
    TOOL = "tool"  # direct invocation of a tool
    CONTROL = "control"  # device actions (lights, volume, etc.)
    SCHEDULE = "schedule"  # reminders, timers, alarms
    AUTONOMY = "autonomy"  # set automations (IFTTT style rules)
    PLAN = "plan"  # delegate request to the planner
    UNKNOWN = "unknown"


class ScheduleAction(str, Enum):
    SET = "schedule.set"
    CANCEL = "schedule.cancel"
    LIST = "schedule.list"


class ScheduleSetArgs(BaseModel):
    id: str
    kind: Literal["timer", "alarm", "plan", "automation"]
    delay_seconds: Optional[int] = None
    run_at: Optional[datetime] = None
    cron: Optional[str] = None
    time_expression: Optional[str] = None
    label: Optional[str] = None


class ScheduleCancelArgs(BaseModel):
    id: str


class ScheduleListArgs(BaseModel):
    kind: Literal["timer", "alarm", "automation", "all"]


class BaseIntent(BaseModel):
    type: IntentType
    subtype: Optional[str | list[str]] = None
    confidence: float
    arguments: Dict[str, Any] = {}


class ScheduleSetIntent(BaseModel):
    type: Literal[IntentType.SCHEDULE]
    subtype: Literal[ScheduleAction.SET]
    confidence: float
    arguments: ScheduleSetArgs


class ScheduleCancelIntent(BaseModel):
    type: Literal[IntentType.SCHEDULE]
    subtype: Literal[ScheduleAction.CANCEL]
    confidence: float
    arguments: ScheduleCancelArgs


class ScheduleListIntent(BaseModel):
    type: Literal[IntentType.SCHEDULE]
    subtype: Literal[ScheduleAction.LIST]
    confidence: float
    arguments: ScheduleListArgs


ScheduleIntent = Union[
    ScheduleSetIntent,
    ScheduleCancelIntent,
    ScheduleListIntent,
]


class Intent(RootModel[Union[ScheduleIntent, BaseIntent]]):
    pass


class PlanStep(BaseModel):
    id: str
    tool: str
    arguments: Dict[str, Any] = {}
    depends_on: list[str] | None = None
    skip_on_failure: bool = False


class Plan(BaseModel):
    name: str | None = None
    steps: list[PlanStep]


class PlanExecutionResult(BaseModel):
    plan_name: str | None = None
    status: Literal["success", "partial", "in_progress", "failed"] = "in_progress"
    user_input: str
    completed_steps: list[str] = []
    failed_steps: list[str] = []
    step_results: Dict[str, Any] = {}
    results: Dict[str, Any] = {}
    start_time: float
    end_time: float | None
    exception: str | None = None


class LLMCallOptions(BaseModel):
    system_prompt: str
    memory: Optional[list[dict[str, Any]]] = None
    format: Dict[str, Any] | Literal["", "json"] | None = None
    think: Literal["low", "medium", "high"] = "low"
    instructions: Optional[str] = None
