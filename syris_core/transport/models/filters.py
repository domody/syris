from typing import Optional, Set, List
from pydantic import BaseModel, Field

from .enums import EventKind, Level

class StreamSubscription(BaseModel):
    name: str = Field(min_length=1, max_length=64)
    kinds: Optional[Set[EventKind]] = None
    levels: Optional[Set[Level]] = None

    include_payload: bool = True
    sample_rate: float = Field(default=1.0, ge=0.0, le=1.0)

class TransportFilters(BaseModel):
    request_id: Optional[str] = Field(default=None, max_length=128)
    entity_id: Optional[str] = Field(default=None, max_length=256)
    entity_prefix: Optional[str] = Field(default=None, max_length=256)

    kinds: Optional[Set[EventKind]] = None
    levels: Optional[Set[Level]] = None

class SubscribeOptions(BaseModel):
    include_recent: bool = True
    recent_limit: int = Field(default=200, ge=0, le=10_000)