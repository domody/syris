from typing import Any

from syris_core.llm.intent.normalization import NormalizationRuleResult, NormalizationRule

class DefaultQueryTargetToHomeAll(NormalizationRule):
    name = "ha.query.default_target_home_all"

    def apply(self, args: dict, text: str, ctx: Any) -> NormalizationRuleResult:
        if "target" in args and isinstance(args["target"], dict):
            return NormalizationRuleResult(name=self.name)

        # safe default for queries: query whole domain
        patch = {"target": {"scope": "home", "selector": "all"}}
        return NormalizationRuleResult(
            name=self.name,
            applied=True,
            patch=patch,
            warnings=["No target provided for query; defaulted to home/all."],
        )
