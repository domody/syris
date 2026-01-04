
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field

from .enums import EventKind, Level
from .ids import EventId


JsonDict = Dict[str, Any]

class TransportEvent(BaseModel):
    id: EventId
    ts_ms: int = Field(ge=0)

    kind: EventKind
    level: Level = Level.INFO

    # correlation / graph
    trace_id: Optional[str] = Field(default=None, max_length=128)
    request_id: Optional[str] = Field(default=None, max_length=128)
    parent_event_id: Optional[str] = Field(default=None, max_length=128)
    entity_id: Optional[str] = Field(default=None, max_length=256)

    # provenance
    user_id: Optional[str] = Field(default=None, max_length=128)
    source: Optional[str] = Field(default=None, max_length=128)

    # routing hints
    integration_id: Optional[str] = Field(default=None, max_length=128)
    tool_name: Optional[str] = Field(default=None, max_length=128)

    # optional schema marker
    schema: Optional[str] = Field(default=None, max_length=64)

    payload: JsonDict = Field(default_factory=dict)