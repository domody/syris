from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel

class IntentType(str, Enum):
    CHAT = "chat"                     # normal conversation, greetings, small talk
    QUERY = "query"                   # ask for info (time, weather, definitions)
    TOOL = "tool"             # direct invocation of a tool
    CONTROL = "control"               # device actions (lights, volume, etc.)
    SCHEDULE = "schedule"             # reminders, timers, alarms
    AUTONOMY = "autonomy"             # set automations (IFTTT style rules)
    UNKNOWN = "unknown"

class Intent(BaseModel):
    type: IntentType
    subtype: Optional[str] = None
    confidence: float
    arguments: Dict[str, Any] = {}