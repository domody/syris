from typing import Any

from syris_core.llm.intent.normalization import NormalizationRuleResult, NormalizationRule
from ..helpers import _as_enum_value, _get

class CanonicalizeBrightnessZeroToPowerOff(NormalizationRule):
    name = "ha.canonicalize.brightness0_to_power_off"

    def apply(self, args: dict, text: str, ctx: Any) -> NormalizationRuleResult:
        domain = _as_enum_value(args.get("domain"))
        op = _as_enum_value(args.get("operation"))
        brightness = _get(args, "data.brightness")

        if domain != "light":
            return NormalizationRuleResult(name=self.name)

        if op != "set_brightness":
            return NormalizationRuleResult(name=self.name)

        if brightness != 0:
            return NormalizationRuleResult(name=self.name)

        # Prefer canonical "power_off" always (optional: gate on off-phrases)
        patch = {"operation": "power_off", "data": {}}
        return NormalizationRuleResult(
            name=self.name,
            applied=True,
            patch=patch,
            warnings=["Canonicalized light set_brightness(brightness=0) to power_off."],
        )