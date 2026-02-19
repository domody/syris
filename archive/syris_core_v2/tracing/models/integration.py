from dataclasses import dataclass, field
from typing import Any, Optional

@dataclass
class IntegrationError:
    code: str
    message: Optional[str] = None

@dataclass
class IntegrationState:
    integration_id: str
    # core
    connected: bool = False
    ws_alive: Optional[bool] = None
    auth_ok: Optional[bool] = None
    latency_ms: Optional[int] = None
    permissions: dict[str, bool] = field(default_factory=dict)
    last_error: Optional[IntegrationError] = None

    # misc
    details: dict[str, Any] = field(default_factory=dict)

    # projector metadata
    last_event_ts: float = 0.0

    def to_snapshot_dict(self) -> dict[str, Any]:
        return {
            "connected": self.connected,
            "ws_alive": self.ws_alive,
            "auth_ok": self.auth_ok,
            "latency_ms": self.latency_ms,
            "permissions": dict(self.permissions),
            "last_error": (
                None
                if self.last_error is None
                else {"code": self.last_error.code, "message": self.last_error.message}
            ),
            "details": dict(self.details) if self.details else {},
        }
