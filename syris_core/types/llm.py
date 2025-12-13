from enum import Enum
from typing import Optional, Dict, Any, Literal
from pydantic import BaseModel

class IntentType(str, Enum):
    CHAT = "chat"                     # normal conversation, greetings, small talk
    QUERY = "query"                   # ask for info (time, weather, definitions)
    TOOL = "tool"                     # direct invocation of a tool
    CONTROL = "control"               # device actions (lights, volume, etc.)
    SCHEDULE = "schedule"             # reminders, timers, alarms
    AUTONOMY = "autonomy"             # set automations (IFTTT style rules)
    PLAN = "plan"                     # delegate request to the planner
    UNKNOWN = "unknown"

class Intent(BaseModel):
    type: IntentType
    subtype: Optional[str | list[str]] = None
    confidence: float
    arguments: Dict[str, Any] = {}

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