from typing import Any

from syris_core.llm.intent.normalization import NormalizationRuleResult, NormalizationRule
from ..helpers import _as_enum_value, _get, _lower
from .tables import PHRASE_TO_OP, ALLOWED_OPS

def detect_preferred_operation(text: str) -> str | None:
    t = _lower(text)
    for phrases, op in PHRASE_TO_OP:
        if any(p in t for p in phrases):
            return op
    return None


class PhrasePreferredOperationRule(NormalizationRule):
    name = "ha.intent.phrase_preferred_operation"

    def apply(self, args: dict, text: str, ctx: Any) -> NormalizationRuleResult:
        preferred = detect_preferred_operation(text)
        if not preferred:
            return NormalizationRuleResult(name=self.name)

        domain = _as_enum_value(args.get("domain"))
        current = _as_enum_value(args.get("operation")) if "operation" in args else ""

        # Only apply if:
        # - operation missing, OR
        # - operation is an "equivalent/loose" choice we want to steer away from,
        # - AND preferred op is compatible with the (current) domain if domain exists.
        #
        # This avoids overriding explicit numeric operations like set_brightness when user specified 20%.
        if current in ("", None):
            can_apply = True
        elif preferred == "power_off" and current == "set_brightness" and _get(args, "data.brightness") == 0:
            can_apply = True
        elif preferred in ("power_on", "power_off", "power_toggle") and current == "set_brightness":
            # if brightness not specified, this was likely a weird fill; prefer power_on/off
            can_apply = _get(args, "data.brightness") is None
        else:
            can_apply = False

        if not can_apply:
            return NormalizationRuleResult(name=self.name)

        # If domain is present, ensure preferred operation is valid for it.
        if domain and domain in ALLOWED_OPS and preferred not in ALLOWED_OPS[domain]:
            return NormalizationRuleResult(
                name=self.name,
                errors=[f"Operation '{preferred}' is not valid for domain '{domain}'."],
            )

        return NormalizationRuleResult(
            name=self.name,
            applied=True,
            patch={"operation": preferred},
            warnings=[f"Chose canonical operation '{preferred}' based on user phrasing."],
        )
