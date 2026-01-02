from pydantic import BaseModel, Field, field_validator
from typing import Literal, Any, Dict, List

class NotificationCandidate(BaseModel):
    dedupe_key: str
    category: str
    severity: Literal["info", "important", "critical"]
    confidence: float
    message_short: str
    message_long: str
    cooldown_s: int
    channels_allowed: List[Literal["voice", "log", "queue"]] = Field(default_factory=lambda: ["log"])
    context: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("confidence")
    @classmethod
    def _clamp_confidence(cls, v: float) -> float:
        return max(0.0, min(1.0, v))