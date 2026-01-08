from typing import Any

from syris_core.llm.intent.normalization import NormalizationRuleResult, NormalizationRule
from ..helpers import _as_enum_value
from .tables import ALLOWED_OPS

class ValidateDomainOperationCompatibility(NormalizationRule):
    name = "ha.validate.domain_operation_compatibility"

    def apply(self, args: dict, text: str, ctx: Any) -> NormalizationRuleResult:
        domain = _as_enum_value(args.get("domain"))
        op = _as_enum_value(args.get("operation"))

        if not domain:
            return NormalizationRuleResult(
                name=self.name,
                errors=["missing:domain"],
            )

        if domain not in ALLOWED_OPS:
            return NormalizationRuleResult(
                name=self.name,
                errors=[f"Unknown/unsupported HA domain '{domain}'."],
                stop=True,
            )

        if not op:
            return NormalizationRuleResult(
                name=self.name,
                errors=["missing:operation"],
            )

        if op not in ALLOWED_OPS[domain]:
            return NormalizationRuleResult(
                name=self.name,
                errors=[f"Operation '{op}' is not valid for domain '{domain}'."],
                stop=True,
            )

        return NormalizationRuleResult(name=self.name)