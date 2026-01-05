from enum import Enum
from typing import Optional, Dict, Any, Literal, Union, Annotated, List, Sequence, Mapping
from datetime import datetime
from pydantic import BaseModel, RootModel, Field
from ollama import Options, Tool

class IntentType(str, Enum):
    CHAT = "chat"  # normal conversation, greetings, small talk
    QUERY = "query"  # ask for info (time, weather, definitions)
    TOOL = "tool"  # direct invocation of a tool
    CONTROL = "control"  # device actions (lights, volume, etc.)
    SCHEDULE = "schedule"  # reminders, timers, alarms
    AUTONOMY = "autonomy"  # set automations (IFTTT style rules)
    PLAN = "plan"  # delegate request to the planner
    UNKNOWN = "unknown"


class BaseIntent(BaseModel):
    type: Literal[IntentType.UNKNOWN]
    subtype: Optional[str | list[str]] = None
    confidence: float
    arguments: Dict[str, Any] = {}


class ScheduleAction(str, Enum):
    SET = "schedule.set"
    CANCEL = "schedule.cancel"
    LIST = "schedule.list"


class ScheduleSetArgs(BaseModel):
    subtype: Literal[ScheduleAction.SET]
    id: str
    kind: Literal["timer", "alarm", "plan", "automation"]
    delay_seconds: int | None = None
    run_at: datetime | None = None
    cron: str | None = None
    time_expression: str | None = None
    label: str | None = None


class ScheduleCancelArgs(BaseModel):
    subtype: Literal[ScheduleAction.CANCEL]
    id: str


class ScheduleListArgs(BaseModel):
    subtype: Literal[ScheduleAction.LIST]
    kind: Literal["timer", "alarm", "automation", "all"]


ScheduleArgs = Annotated[
    Union[ScheduleSetArgs, ScheduleCancelArgs, ScheduleListArgs],
    Field(discriminator="subtype"),
]


class ScheduleIntent(BaseModel):
    type: Literal[IntentType.SCHEDULE]
    subtype: None
    confidence: float
    arguments: ScheduleArgs


class ControlDomain(str, Enum):
    LIGHT = "light"
    COVER = "cover"
    CLIMATE = "climate"
    SWITCH = "switch"
    MEDIA_PLAYER = "media_player"


class ControlOperation(str, Enum):
    POWER_ON = "power_on"
    POWER_OFF = "power_off"
    POWER_TOGGLE = "power_toggle"

    SET_BRIGHTNESS = "set_brightness"
    SET_COLOR_TEMP = "set_color_temp"

    OPEN = "open"
    CLOSE = "close"
    SET_POSITION = "set_position"

    SET_TEMPERATURE = "set_temperature"


class TargetScope(str, Enum):
    HOME = "home"
    AREA = "area"
    NAME = "name"
    ENTITY_ID = "entity_id"

class HomeTarget(BaseModel):
    scope: Literal["home"]
    selector: Literal["all", "one", "many"] = "all"
    area: None = None
    name: None = None
    entity_ids: List[str] = []

class NameTarget(BaseModel):
    scope: Literal["name"]
    selector: Literal["one", "many"] = "one"
    area: None = None
    name: str
    entity_ids: List[str] = []

class EntityIdTarget(BaseModel):
    scope: Literal["entity_id"]
    selector: Literal["one", "many"] = "many"
    area: None = None
    name: None = None
    entity_ids: List[str]

TargetSpec = Annotated[Union[HomeTarget, NameTarget, EntityIdTarget], Field(discriminator="scope")]

# class TargetSpec(BaseModel):
#     # scope: TargetScope
#     scope: Literal["home", "entity_id", "name"] = "home"
#     selector: Literal["all", "one", "many"] = "all"

#     area: Optional[str] = None
#     name: Optional[str] = None
#     entity_ids: Optional[List[str]] = None


class StateQueryKind(str, Enum):
    STATE = "state"  # on/off/unavailable + main attributes
    BRIGHTNESS = "brightness"
    POSITION = "position"
    TEMPERATURE = "temperature"


class QueryAction(BaseModel):
    kind: Literal["ha.state_query"]
    domain: ControlDomain
    target: TargetSpec

    query: StateQueryKind

    # summarize: bool = True


class ControlAction(BaseModel):
    kind: Literal["ha.call_service"]
    domain: ControlDomain
    operation: ControlOperation
    target: TargetSpec
    data: Dict[str, Any] = Field(default_factory=dict)
    requires_confirmation: bool = False


Action = Annotated[Union[ControlAction, QueryAction], Field(discriminator="kind")]


class ControlArgs(BaseModel):
    actions: List[Action]
    # dry_run: bool = False


class ControlIntent(BaseModel):
    type: Literal[IntentType.CONTROL]
    subtype: Literal["ha.service_call_plan"] = "ha.service_call_plan"
    confidence: float
    arguments: ControlArgs


class ChatArgs(BaseModel):
    text: str


class ChatIntent(BaseModel):
    type: Literal[IntentType.CHAT]
    subtype: None
    confidence: float
    arguments: ChatArgs


class ToolArgs(BaseModel):
    arguments: Dict[str, Any]  # Any -> Dict of args. Format not confirmed


class ToolIntent(BaseModel):
    type: Literal[IntentType.TOOL]
    subtype: List[str]
    confidence: float
    arguments: ToolArgs


IntentUnion = Annotated[
    Union[
        ScheduleIntent,
        ControlIntent,
        ToolIntent,
        ChatIntent,
        BaseIntent,  # fallback
    ],
    Field(discriminator="type"),
]


class Intent(RootModel[IntentUnion]):
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
    think: Literal[None, "low", "medium", "high"] = "low"
    instructions: Optional[str] = None
    tools: Optional[Sequence[Mapping[str, Any]]] = None
    options: Optional[Mapping[str, Any] | Options] = None
