import re
from dataclasses import dataclass
from typing import Any

from .registry import LANE_REGISTRY, IMPERATIVE_VERBS, INTERROGATIVES
from .re_commons import _tokens, _normalize_phrase

RE_IN_DURATION = re.compile(r"\bin\s+\d+\s*(second|seconds|minute|minutes|hour|hours)\b", re.I)
RE_AT_TIME = re.compile(r"\bat\s+\d{1,2}(:\d{2})?\s*(am|pm)?\b", re.I)
RE_DATE_WORDS = re.compile(r"\b(today|tomorrow|tonight|next\s+week|next\s+month)\b", re.I)
RE_RECURRENCE = re.compile(r"\b(every|daily|weekly|weekdays|weekends|each)\b", re.I)
RE_CONDITION = re.compile(r"\b(if|when|whenever|unless|only\s+if|as\s+long\s+as)\b", re.I)

@dataclass(frozen=True)
class _LaneKeywordIndex:
    # token keyword: set(lane id)
    token_to_lanes: dict[str, set[str]]

    # (normalized phrase, lane id)
    phrases: list[tuple[str, str]]

    # lane id: set(normalized keywords)
    lane_keywords_norm: dict[str, set[str]]


def _build_lane_keyword_index() -> _LaneKeywordIndex:
    token_to_lanes: dict[str, set[str]] = {}
    phrases: list[tuple[str, str]] = []
    lane_keywords_norm: dict[str, set[str]] = {}

    for lane_id, lane in LANE_REGISTRY.items():
        kws = lane.keywords or []
        norm_set: set[str] = set()

        for kw in kws:
            if not kw:
                continue
            kw_norm = _normalize_phrase(kw)
            norm_set.add(kw_norm)

            toks = _tokens(kw_norm)
            if len(toks) == 1 and toks[0] == kw_norm:
                token_to_lanes.setdefault(kw_norm, set()).add(lane_id)
            else:
                phrases.append((kw_norm, lane_id))

        lane_keywords_norm[lane_id] = norm_set

    return _LaneKeywordIndex(
        token_to_lanes=token_to_lanes,
        phrases=phrases,
        lane_keywords_norm=lane_keywords_norm
    )

# build once at import
_LANE_KW_INDEX = _build_lane_keyword_index()

# rebuild index used when registries are hotreloaded at runtime
def rebuild_lane_keyword_index() -> None:
    global _LANE_KW_INDEX
    _LANE_KW_INDEX = _build_lane_keyword_index()


def score_lane(text: str, top_n: int = 3) -> dict[str, Any]:
    t = text.strip()
    t_norm = _normalize_phrase(t)
    toks = _tokens(t_norm)
    tok_set = set(toks)

    has_imperative = any(tok in IMPERATIVE_VERBS for tok in toks)
    has_interrogative = any(tok in INTERROGATIVES for tok in toks)
    ends_q = t_norm.endswith("?")

    has_time_signal = bool(RE_IN_DURATION.search(t_norm) or RE_AT_TIME.search(t_norm) or RE_DATE_WORDS.search(t_norm))
    has_recurrence_signal = bool(RE_RECURRENCE.search(t_norm))
    has_condition_signal = bool(RE_CONDITION.search(t_norm))

    flags = {
        "has_imperative": has_imperative,
        "has_interrogative": has_interrogative,
        "ends_with_qmark": ends_q,
        "has_time_signal": has_time_signal,
        "has_recurrence_signal": has_recurrence_signal,
        "has_condition_signal": has_condition_signal,
    }

    scores: dict[str, float] = {lane_id: 0.0 for lane_id in LANE_REGISTRY.keys()}
    matched: dict[str, dict[str, list[str]]] = {
        lane_id: {"tokens": [], "phrases": []} for lane_id in LANE_REGISTRY.keys()
    }
    reasons: dict[str, list[str]] = {lane_id: [] for lane_id in LANE_REGISTRY.keys()}

    for tok in tok_set:
        lane_ids = _LANE_KW_INDEX.token_to_lanes.get(tok)
        if not lane_ids:
            continue
        for lane_id in lane_ids:
            matched[lane_id]["tokens"].append(tok)

    for phrase, lane_id in _LANE_KW_INDEX.phrases:
        if phrase and phrase in t_norm:
            matched[lane_id]["phrases"].append(phrase)
    
    for lane_id in LANE_REGISTRY.keys():
        tok_hits = len(set(matched[lane_id]["tokens"]))
        phrase_hits = len(set(matched[lane_id]["phrases"]))

        if tok_hits:
            add = min(4.0, float(tok_hits))
            scores[lane_id] += add
            reasons[lane_id].append(f"+{add:.1f} token_hits({tok_hits})")

        if phrase_hits:
            add = min(4.0, float(phrase_hits) * 1.5)
            scores[lane_id] += add
            reasons[lane_id].append(f"+{add:.1f} phrase_hits({phrase_hits})")
        
        if has_imperative and (tok_hits + phrase_hits) > 0:
            scores[lane_id] += 0.2
            reasons[lane_id].append("+0.2 imperative_nudge")

    if "chat" in scores:
        scores["chat"] += 0.2
        reasons["chat"].append("+0.2 baseline")

        non_chat_evidence = any(
            (lane_id != "chat") and (len(matched[lane_id]["tokens"]) + len(matched[lane_id]["phrases"]) > 0)
            for lane_id in scores.keys()
        )
        if (has_interrogative or ends_q) and not non_chat_evidence:
            scores["chat"] += 0.3
            reasons["chat"].append("+0.3 questions_without_lane_evidence")

    ranked = sorted(scores.items(), key= lambda kv: kv[1], reverse=True)
    top = [lane_id for lane_id, _ in ranked[:max(1, top_n)]]

    for lane_id in matched.keys():
        matched[lane_id]["tokens"] = sorted(set(matched[lane_id]["tokens"]))
        matched[lane_id]["phrases"] = sorted(set(matched[lane_id]["phrases"]))

    return {
        "top_lanes": top,
        "scores": scores,
        "matched": matched,
        "flags": flags,
        "reasons": {lane_id: reasons[lane_id] for lane_id in top},
    }


def build_lane_router_schema(candidates: list[str], include_chat_fallback: bool = True) -> dict[str, Any]:
    allowed = []
    seen = set()
    for r in candidates:
        if r not in seen:
            allowed.append(r)
            seen.add(r)

    if include_chat_fallback and "chat" not in seen:
        allowed.append("chat")

    return {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "route": {
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

def build_lane_router_prompt(candidates: list[str]) -> str:
    defs = ""
    for candidate in candidates:
        lane = LANE_REGISTRY.get(candidate)
        if not lane:
            continue
        defs += f"{lane.prompt_line}\n"

    base = f"""You are IntentLaneRouter. Your job is to choose the single best route lane for the user's message.

Return ONLY a JSON object that matches the provided schema.
Do not include any extra keys, comments, or text.

{defs}

Prefer the most concrete, executable interpretation.
If multiple actions are requested, pick the route that represents the primary/first action.
"""
    return base