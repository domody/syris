from dataclasses import dataclass
from contextvars import ContextVar
from typing import Optional

@dataclass(frozen=True)
class TraceContext:
    trace_id: Optional[str] = None
    request_id: Optional[str] = None
    parent_event_id: Optional[str] = None

TRACE_CTX: ContextVar[TraceContext] = ContextVar("TRACE_CTX", default=TraceContext())