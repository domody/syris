from typing import Any
import copy
from dataclasses import dataclass
from syris_core.llm.intent.normalization import ArgNormalizer, NormalizeResult, NormalizationRule, NormalizationRuleResult
from syris_core.util.logger import log

from .helpers import _deep_merge
from .rules.brightness_0_to_power_off import CanonicalizeBrightnessZeroToPowerOff
from .rules.validate_domain_operation_compatibility import ValidateDomainOperationCompatibility
from .rules.validate_target_spec import ValidateTargetSpecShape
from .rules.validate_required_data_keys import ValidateRequiredDataKeys
from .rules.phase_preferred_operation import PhrasePreferredOperationRule
from .rules.default_query_target_to_home import DefaultQueryTargetToHomeAll
from .rules.phrase_on_off_dominates import PhraseOnOffDominatesRule

@dataclass(frozen=True)
class _HAClarifyPolicy:
    """
    How to convert missing-field errors into a user-facing question.
    Keep this minimal; specific lanes can enhance later.
    """
    missing_to_question: dict[str, str]

    def question_for(self, missing_errors: list[str]) -> str | None:
        # choose the first mapped missing field
        for e in missing_errors:
            if e in self.missing_to_question:
                return self.missing_to_question[e]
        # generic fallback
        if missing_errors:
            return "I need a bit more detail to do that - what exactly should I target or set?"
        return None


DEFAULT_CLARIFY_POLICY = _HAClarifyPolicy(
    missing_to_question={
        "missing:domain": "Which type of device is this (light, climate, cover, switch, lock, media player)?",
        "missing:operation": "What should I do with it (turn on/off, set brightness, set temperature, open/close)?",
        "missing:target": "Which device or area should I target?",
        "missing:target.scope": "Should I target by device name, entity_id, or the whole home?",
        "missing:target.name": "What's the device name (e.g. 'bed light', 'hall thermostat')?",
        "missing:target.entity_ids": "Which entity_id(s) should I target?",
        "missing:data.brightness": "What brightness should I set (0-255 or a percent)?",
        "missing:data.temperature": "What temperature should I set?",
        "missing:data.position": "What position should I set (0-100%)?",
        "missing:data.color_temp": "What color temperature should I set?",
    }
)

class HomeAssistantArgNormalizer(ArgNormalizer):
    """
    Normalizes HA control/query args produced by Router C.

    subaction_id expected values:
      - "control" (HAControlArgs style)
      - "query"   (HAQueryArgs style)
    """

    def __init__(self, *, clarify_policy: _HAClarifyPolicy = DEFAULT_CLARIFY_POLICY):
        self._clarify = clarify_policy

        # Order matters: canonicalize/equivalence before hard validation.
        self._control_rules: list[NormalizationRule] = [
            PhraseOnOffDominatesRule(),
            CanonicalizeBrightnessZeroToPowerOff(),
            PhrasePreferredOperationRule(),
            ValidateDomainOperationCompatibility(),
            ValidateRequiredDataKeys(),
            ValidateTargetSpecShape(),
        ]

        self._query_rules: list[NormalizationRule] = [
            # Query doesn't have "operation", but we still validate domain/target/query shape.
            DefaultQueryTargetToHomeAll(),
            ValidateTargetSpecShape(),
        ]

    def normalize(self, *, subaction_id: str, raw_args: dict, user_text: str, ctx: Any) -> NormalizeResult:
        args = dict(raw_args or {})
        warnings: list[str] = []
        errors: list[str] = []

        rules = self._control_rules if subaction_id == "control" else self._query_rules

        for rule in rules:
            rr = rule.apply(args, user_text, ctx)
            if rr.warnings:
                warnings.extend(rr.warnings)
            if rr.errors:
                errors.extend(rr.errors)
            if rr.applied and rr.patch:
                before_args = copy.deepcopy(args)
                args = _deep_merge(args, rr.patch)
                if args != before_args:
                    changed_keys = sorted(
                        {k for k in set(before_args) | set(args) if before_args.get(k) != args.get(k)}
                    )
                    log(
                        "ha",
                        (
                            "HA arg normalizer applied "
                            f"{rule.__class__.__name__} patch; "
                            f"changed_keys={changed_keys} "
                            f"patch={rr.patch}"
                        ),
                    )
            if rr.warnings:
                log(
                    "warning",
                    f"HA arg normalizer {rule.__class__.__name__} warnings: {rr.warnings}",
                )
            if rr.errors:
                log(
                    "error",
                    f"HA arg normalizer {rule.__class__.__name__} errors: {rr.errors}",
                )
            if rr.stop:
                break

        # Clarification detection: treat "missing:*" as clarify-able.
        missing = [e for e in errors if e.startswith("missing:")]
        fatal = [e for e in errors if not e.startswith("missing:")]

        if fatal:
            return NormalizeResult(
                ok=False,
                args=args,
                warnings=warnings,
                errors=fatal + missing,  # keep full list for debug
                requires_clarification=False,
                clarification_question=None,
            )

        if missing:
            q = self._clarify.question_for(missing)
            return NormalizeResult(
                ok=False,
                args=args,
                warnings=warnings,
                errors=missing,
                requires_clarification=True,
                clarification_question=q,
            )

        return NormalizeResult(
            ok=True,
            args=args,
            warnings=warnings,
            errors=[],
            requires_clarification=False,
            clarification_question=None,
        )
