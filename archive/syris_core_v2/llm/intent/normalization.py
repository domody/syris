from pydantic import BaseModel, Field
from typing import Protocol, Any

class NormalizeResult(BaseModel):
    ok: bool
    args: dict
    warnings: list[str] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)
    requires_clarification: bool = False
    clarification_question: str | None = None


class ArgNormalizer(Protocol):
    def normalize(
        self, *, subaction_id: str, raw_args: dict, user_text: str, ctx: Any
    ) -> NormalizeResult:
        ...


class NormalizationRuleResult(BaseModel):
    patch: dict[str, Any] = Field(default_factory=dict)
    warnings: list[str] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)
    stop: bool = False
    applied: bool = False
    name: str


class NormalizationRule(Protocol):
    name: str

    def apply(self, args: dict, text: str, ctx: Any) -> NormalizationRuleResult:
        ...