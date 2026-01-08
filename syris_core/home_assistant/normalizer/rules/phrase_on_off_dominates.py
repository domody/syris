from typing import Any

from syris_core.llm.intent.normalization import NormalizationRuleResult, NormalizationRule
from ..helpers import _as_enum_value, _get, _lower

class PhraseOnOffDominatesRule(NormalizationRule):
    name = "ha.intent.phrase_on_off_dominates"

    ON_PHRASES = ("turn on", "switch on", "power on")
    OFF_PHRASES = ("turn off", "switch off", "power off")

    # words that indicate user actually wants non-power ops
    COLOR_HINTS = ("warm", "cool", "color", "colour", "kelvin", "temp", "temperature")
    BRIGHT_HINTS = ("brightness", "%", "percent", "dim", "bright", "brighter", "dark")

    def apply(self, args: dict, text: str, ctx: Any) -> NormalizationRuleResult:
        domain = _as_enum_value(args.get("domain"))
        if domain != "light":
            return NormalizationRuleResult(name=self.name)

        t = _lower(text)
        wants_on = any(p in t for p in self.ON_PHRASES)
        wants_off = any(p in t for p in self.OFF_PHRASES)

        if not (wants_on or wants_off):
            return NormalizationRuleResult(name=self.name)

        # if user explicitly indicated brightness/color temp intent, do not override
        if any(h in t for h in self.COLOR_HINTS) or any(h in t for h in self.BRIGHT_HINTS):
            return NormalizationRuleResult(name=self.name)

        desired = "power_on" if wants_on else "power_off"
        current = _as_enum_value(args.get("operation"))

        if current == desired:
            return NormalizationRuleResult(name=self.name)

        return NormalizationRuleResult(
            name=self.name,
            applied=True,
            patch={"operation": desired, "data": {}},
            warnings=[f"User phrasing implies {desired}; canonicalized operation and cleared data."],
        )
