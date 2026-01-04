from enum import Enum
from typing import Any, Dict, Optional
from pydantic import BaseModel


class EventType(str, Enum):
    INPUT = "input"  # Anything coming from user/HW/API
    SYSTEM = "system"  # Internal system-level events
    TASK = "task"  # Task lifecycle events (created, updated, completed)
    SCHEDULE = "schedule"  # Timers, alarms, reminders firing
    TOOL = "tool"  # Tool invocation and completion
    DEVICE = "device"  # Home automation / IoT updates
    NOTIFY = "notify"  # Notifications to be outputed
    ERROR = "error"  # Failure events anywhere


class Event(BaseModel):
    event_id: Optional[str] = None
    trace_id: Optional[str] = None
    request_id: Optional[str] = None
    parent_event_id: Optional[str] = None

    type: EventType
    user_id: Optional[str] = None
    source: Optional[str] = None
    payload: Dict[str, Any]
    timestamp: float
