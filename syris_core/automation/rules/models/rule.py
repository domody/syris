from typing import List, Optional
from pydantic import BaseModel, Field
from .trigger import DeviceTrigger
from .action import ActionSpec

class RulePolicy(BaseModel):
    enabled: bool = True
    cooldown_s: int = 0

class Rule(BaseModel):
    id: str
    name: Optional[str] = None

    trigger: DeviceTrigger
    actions: List[ActionSpec]

    policy: RulePolicy = Field(default_factory=RulePolicy)