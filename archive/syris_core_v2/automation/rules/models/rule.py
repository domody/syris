from typing import List, Optional
from pydantic import BaseModel, Field
from .trigger import DeviceTrigger
from .action import ActionSpec
from .condition import ConditionSpec


class RulePolicy(BaseModel):
    enabled: bool = True
    cooldown_s: int = 0


class Rule(BaseModel):
    id: str
    name: Optional[str] = None

    trigger: DeviceTrigger
    actions: List[ActionSpec]
    conditions: List[ConditionSpec]

    policy: RulePolicy = Field(default_factory=RulePolicy)
