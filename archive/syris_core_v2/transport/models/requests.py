from dataclasses import dataclass, field
from typing import Any, Dict, Optional, Literal

RequestSource = Literal["dev_console", "dashboard", "voice", "api"]

@dataclass
class UserRequest:
    request_id: str
    created_ts_ms: int
    source: RequestSource

    user_id: Optional[str] = None
    session_id: Optional[str] = None
    trace_id: Optional[str] = None

    # chat
    text: Optional[str] = None

    # structured (future)
    action: Optional[str] = None
    entity_id: Optional[str] = None
    args: Dict[str, Any] = field(default_factory=dict)