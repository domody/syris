from typing import Any

from syris_core.llm.intent.normalization import NormalizationRuleResult, NormalizationRule
from ..helpers import _as_enum_value
from .tables import REQUIRES_DATA_KEYS

class ValidateRequiredDataKeys(NormalizationRule):
    name = "ha.validate.required_data_keys"

    def apply(self, args: dict, text: str, ctx: Any) -> NormalizationRuleResult:
        op = _as_enum_value(args.get("operation"))
        if not op:
            return NormalizationRuleResult(name=self.name)

        required = REQUIRES_DATA_KEYS.get(op)
        if not required:
            return NormalizationRuleResult(name=self.name)

        data = args.get("data") or {}
        missing = [k for k in required if k not in data]

        if not missing:
            return NormalizationRuleResult(name=self.name)

        # missing data is usually a clarification, not a hard error
        return NormalizationRuleResult(
            name=self.name,
            errors=[f"missing:data.{k}" for k in missing],
        )
