import re
from dataclasses import dataclass
from typing import Any, Optional

from ..models.intent import Subaction, Lane
from .registry import LANE_REGISTRY, IMPERATIVE_VERBS, INTERROGATIVES
from .re_commons import _tokens, _normalize_phrase

@dataclass(frozen=True)
class _SubactionKeywordIndex:
    # token keyword: set(action id)
    token_to_subaction: dict[str, set[str]]

    # (normalized phrase, action id)
    phrases: list[tuple[str, str]]

    # action id: set(normalized keywords)
    subaction_keywords_norm: dict[str, set[str]]

def _build_subaction_keyword_index(subactions: dict[str, Subaction]) -> _SubactionKeywordIndex:
    token_to_subaction: dict[str, set[str]] = {}
    phrases: list[tuple[str, str]] = []
    subaction_keywords_norm: dict[str, set[str]] = {}

    for sub_id, sub in subactions.items():
        kws = sub.keywords or []
        norm_set: set[str] = set()

        for kw in kws:
            if not kw:
                continue
            kw_norm = _normalize_phrase(kw)
            norm_set.add(kw_norm)

            toks = _tokens(kw_norm)
            if len(toks) == 1 and toks[0] == kw_norm:
                token_to_subaction.setdefault(kw_norm, set()).add(sub_id)
            else:
                phrases.append((kw_norm, sub_id))

        subaction_keywords_norm[sub_id] = norm_set

    return _SubactionKeywordIndex(
        token_to_subaction=token_to_subaction,
        phrases=phrases,
        subaction_keywords_norm=subaction_keywords_norm,
    )

def _apply_subaction_biases(
    lane: Lane,
    scores: dict[str, float],
    reasons: dict[str, list[str]],
    has_imperative: bool,
    has_interrogative: bool,
    ends_q: bool,
):
    config = lane.config
    if not config or not config.subaction_bias:
        return

    for sub_id, bias in config.subaction_bias.items():
        if sub_id not in scores:
            continue

        if has_imperative and (bias.on_imperative):
            scores[sub_id] += bias.on_imperative
            reasons[sub_id].append(f"+{bias.on_imperative:.1f} bias(imperative)")

        if has_interrogative and (bias.on_interrogative):
            scores[sub_id] += bias.on_interrogative
            reasons[sub_id].append(f"+{bias.on_interrogative:.1f} bias(interrogative)")

        if ends_q and (bias.on_question_mark):
            scores[sub_id] += bias.on_question_mark
            reasons[sub_id].append(f"+{bias.on_question_mark:.1f} bias(?)")

        if has_imperative and has_interrogative and (bias.on_imperative_beats_question):
            scores[sub_id] += bias.on_imperative_beats_question
            reasons[sub_id].append(f"+{bias.on_imperative_beats_question:.1f} bias(imp>q)")

def score_subactions(lane_id: str, text: str, top_n: int = 3) -> dict[str, Any]:
    lane = LANE_REGISTRY.get(lane_id)
    empty = {
            "top_subactions": [],
            "scores": {},
            "matched": {},
            "flags": {},
            "reasons": {},
        }
    if not lane:
        return empty
    
    subactions = lane.subactions
    if not subactions:
        return empty
    index = _build_subaction_keyword_index(subactions)
    print(index)
    t = text.strip()
    t_norm = _normalize_phrase(t)
    toks = _tokens(t_norm)
    tok_set = set(toks)

    has_imperative = any(tok in IMPERATIVE_VERBS for tok in toks)
    has_interrogative = any(tok in INTERROGATIVES for tok in toks)
    ends_q = t_norm.endswith("?")

    flags = {
        "has_imperative": has_imperative,
        "has_interrogative": has_interrogative,
        "ends_with_qmark": ends_q,
    }

    scores: dict[str, float] = {sub_id: 0.0 for sub_id in subactions.keys()}
    matched: dict[str, dict[str, list[str]]] = {
        sub_id: {"tokens": [], "phrases": []} for sub_id in subactions.keys()
    }
    reasons: dict[str, list[str]] = {sub_id: [] for sub_id in subactions.keys()}

    for tok in tok_set:
        sub_ids = index.token_to_subaction.get(tok)
        if not sub_ids:
            continue
        for sub_id in sub_ids:
            matched[sub_id]["tokens"].append(tok)

        for phrase, sub_id in index.phrases:
            if phrase and phrase in t_norm:
                matched[sub_id]["phrases"].append(phrase)

        for sub_id in subactions.keys():
            tok_hits = len(set(matched[sub_id]["tokens"]))
            phrase_hits = len(set(matched[sub_id]["phrases"]))

            if tok_hits:
                add = min(4.0, float(tok_hits))
                scores[sub_id] += add
                reasons[sub_id].append(f"+{add:.1f} token_hits({tok_hits})")

            if phrase_hits:
                add = min(4.0, float(phrase_hits) * 1.5)
                scores[sub_id] += add
                reasons[sub_id].append(f"+{add:.1f} phrase_hits({phrase_hits})")

    _apply_subaction_biases(lane, scores, reasons, has_imperative, has_interrogative, ends_q)

    ranked = sorted(scores.items(), key= lambda kv: kv[1], reverse=True)
    top = [sub_id for sub_id, _ in ranked[:max(1, top_n)]]

    for sub_id in matched.keys():
        matched[sub_id]["tokens"] = sorted(set(matched[sub_id]["tokens"]))
        matched[sub_id]["phrases"] = sorted(set(matched[sub_id]["phrases"]))

    return {
        "top_subactions": top,
        "scores": scores,
        "matched": matched,
        "flags": flags,
        "reasons": {sub_id: reasons[sub_id] for sub_id in top},
    }

def build_subaction_router_schema(candidates: list[str]) -> dict[str, Any]:
    allowed = []
    seen = set()
    for s in candidates:
        if s not in seen:
            allowed.append(s)
            seen.add(s)

    return {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "subaction": {
                "type": "string",
                "enum": allowed,
            },
            "confidence": {
                "type": "number",
                "minimum": 0.0,
                "maximum": 1.0,
            },
        },
        "required": ["route", "confidence"],
    }

def build_subaction_router_prompt(lane_id: str, candidates: list[str]) -> Optional[str]:
    lane = LANE_REGISTRY.get(lane_id)
    if not lane or not lane.subactions:
        return None

    defs = ""
    for candidate in candidates:
        subaction = lane.subactions.get(candidate)
        if not subaction:
            continue
        defs += subaction.prompt_line

    base = f"""You are IntentSubactionRouter. Your job is to choose the single best subaction for the user's message within the selected lane.

Return ONLY a JSON object that matches the provided schema.
Do not include any extra keys, comments, or text.

{defs}

Prefer the most concrete, executable interpretation.
If multiple actions are requested, pick the subaction that represents the primary/first action.
"""

    return base