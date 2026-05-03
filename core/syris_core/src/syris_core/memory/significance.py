"""Ingest-time significance scoring for MessageEvents.

Rules are defined as an explicit, auditable table of (condition, delta, tag)
tuples — see ADR-3 §Significance Scoring. No DB access, no LLM calls.
"""
import re
from typing import Callable

from ..schemas.memory import SignificanceResult

# ADR-3: explicit preference marker keywords
_PREFERENCE_MARKERS: frozenset[str] = frozenset({
    "always", "never", "i prefer", "i hate", "make sure",
})

# Heuristics for "explicit instruction to the system"
_INSTRUCTION_PATTERNS: tuple[str, ...] = (
    "you should",
    "you must",
    "you need to",
    "from now on",
    "always do",
    "never do",
    "do not",
    "don't",
    "remember to",
    "make sure you",
    "i need you to",
    "please always",
    "please never",
)

# Decision / outcome language
_DECISION_TERMS: tuple[str, ...] = (
    "decided",
    "decision",
    "confirmed",
    "approved",
    "rejected",
    "completed",
    "concluded",
    "resolved",
    "will proceed",
    "going forward",
    "agreed to",
    "chosen to",
)

# ADR-3: "< 20 tokens" — approximated as whitespace-delimited words
_ROUTINE_TOKEN_THRESHOLD: int = 20

# Named-entity heuristic: two or more consecutive Title-Case words.
# Single capitalised words are excluded (sentence starts, the pronoun "I").
_ENTITY_PATTERN: re.Pattern[str] = re.compile(
    r"\b(?!I\b)[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b"
)


def _has_preference_marker(content: str) -> bool:
    lower = content.lower()
    return any(marker in lower for marker in _PREFERENCE_MARKERS)


def _has_explicit_instruction(content: str) -> bool:
    lower = content.lower()
    return any(pattern in lower for pattern in _INSTRUCTION_PATTERNS)


def _has_named_entity(content: str) -> bool:
    return bool(_ENTITY_PATTERN.search(content))


def _has_decision_outcome(content: str) -> bool:
    lower = content.lower()
    return any(term in lower for term in _DECISION_TERMS)


def _is_routine_exchange(content: str, tool_invoked: bool) -> bool:
    """ADR-3: short exchange with no tool call and no preference marker."""
    return (
        len(content.split()) < _ROUTINE_TOKEN_THRESHOLD
        and not tool_invoked
        and not _has_preference_marker(content)
    )


# Condition signature: (content: str, tool_invoked: bool, approval_gated: bool) -> bool
_RuleCondition = Callable[[str, bool, bool], bool]

_RULES: list[tuple[_RuleCondition, float, str]] = [
    (lambda c, ti, ag: _has_preference_marker(c),    0.4,  "preference_marker"),
    (lambda c, ti, ag: _has_explicit_instruction(c), 0.5,  "explicit_instruction"),
    (lambda c, ti, ag: ti,                           0.2,  "tool_invoked"),
    (lambda c, ti, ag: ag,                           0.3,  "approval_gated"),
    (lambda c, ti, ag: _has_named_entity(c),         0.1,  "named_entity"),
    (lambda c, ti, ag: _has_decision_outcome(c),     0.3,  "decision_outcome"),
    (lambda c, ti, ag: _is_routine_exchange(c, ti), -0.1,  "routine_exchange"),
]


def score_event(
    content: str,
    source: str,
    structured: dict,
    *,
    anchor_threshold: float = 0.85,
    tool_invoked: bool = False,
    approval_gated: bool = False,
) -> SignificanceResult:
    """Score a MessageEvent for memory significance.

    Applies the ADR-3 additive rules table. Clamped to [0.0, 1.0].
    Pass anchor_threshold to override the default (useful in tests).
    tool_invoked and approval_gated are post-execution signals — callers
    in run.py set these after the executor returns.
    """
    score: float = 0.0
    matched_tags: list[str] = []

    for condition, delta, tag in _RULES:
        if condition(content, tool_invoked, approval_gated):
            score += delta
            matched_tags.append(tag)

    score = max(0.0, min(1.0, score))
    is_anchor = score >= anchor_threshold

    anchor_reason: str | None = None
    if is_anchor:
        anchor_reason = (
            f"auto-anchored: scored {score:.2f} via [{', '.join(matched_tags)}]"
        )

    return SignificanceResult(
        score=score,
        tags=matched_tags,
        is_anchor=is_anchor,
        anchor_reason=anchor_reason,
    )
