from typing import Any

from syris_core.llm.intent.normalization import NormalizationRuleResult, NormalizationRule
from ..helpers import _as_enum_value

class ValidateTargetSpecShape(NormalizationRule):
    name = "ha.validate.target_spec"

    def apply(self, args: dict, text: str, ctx: Any) -> NormalizationRuleResult:
        target = args.get("target")
        if not isinstance(target, dict):
            return NormalizationRuleResult(
                name=self.name,
                errors=["missing:target"],
            )

        scope = _as_enum_value(target.get("scope"))
        if not scope:
            return NormalizationRuleResult(
                name=self.name,
                errors=["missing:target.scope"],
            )

        if scope == "name":
            if not target.get("name"):
                return NormalizationRuleResult(
                    name=self.name,
                    errors=["missing:target.name"],
                )
        elif scope == "entity_id":
            ids = target.get("entity_ids") or []
            if not isinstance(ids, list) or len(ids) == 0:
                return NormalizationRuleResult(
                    name=self.name,
                    errors=["missing:target.entity_ids"],
                )
        elif scope == "home":
            # home target is valid with just scope; selector optional
            pass
        else:
            return NormalizationRuleResult(
                name=self.name,
                errors=[f"Unknown target.scope '{scope}'."],
                stop=True,
            )

        return NormalizationRuleResult(name=self.name)