import re
from dataclasses import dataclass
from typing import Iterable, Dict, Set, List, Tuple

from syris_core.tools.registry import TOOL_PROMPT_LIST

@dataclass(frozen=True)
class ToolDef: 
    name: str
    description: str | None

_WORD_RE = re.compile(r"[a-z0-9]+")

def _tokens(s: str) -> list[str]:
    return _WORD_RE.findall(s.lower())

TOOL_SYNONYMS: Dict[str, Set[str]] = {
    "cpu": {"cpu", "processor", "load", "usage", "utilization"},
    "memory": {"memory", "ram", "usage", "utilization"},
    "disk": {"disk", "storage", "drive", "ssd", "hdd", "usage", "utilization"},
    "os": {"os", "system", "platform", "version", "kernel"},
    "uptime": {"uptime", "boot", "since", "reboot"},
    "time": {"time", "clock", "now"},
    "date": {"date", "today"},
}

STOP = {"get", "usage", "info"}  

def build_tool_keyword_index(tools: Iterable[ToolDef]) -> Tuple[Dict[str, Set[str]], Set[str]]:
    """
    Returns:
      kw_to_tools: keyword -> set(tool_name)
      all_keywords: set of all keywords (for quick scanning)
    """
    kw_to_tools: Dict[str, Set[str]] = {}

    for t in tools:
        base_tokens = set(_tokens(t.name))
        if t.description:
            base_tokens |= set(_tokens(t.description))

        # Also split name by '.' and '_' via tokeniser already.
        for tok in list(base_tokens):
            if tok in STOP:
                continue
            kw_to_tools.setdefault(tok, set()).add(t.name)

        # Add synonym buckets if the tool name contains a “root” token
        for root, syns in TOOL_SYNONYMS.items():
            if root in base_tokens:
                for s in syns:
                    kw_to_tools.setdefault(s, set()).add(t.name)

    return kw_to_tools, set(kw_to_tools.keys())

tot = TOOL_PROMPT_LIST.split("\n")
it: Iterable[ToolDef] = []
for to in tot:
    try:
        _name, description = to.split(": ", 1)
        name = _name.split("- ", 1)[1]
        if description == "No description":
            description = ""
        it.append(ToolDef(
            name = name,
            description = description
        ))
    except:
        continue

def tool_likeness(text: str, kw_to_tools: Dict[str, Set[str]]) -> dict:
    toks = _tokens(text)
    matched: Dict[str, Set[str]] = {}
    candidate_tools: Set[str] = set()

    for tok in toks:
        if tok in kw_to_tools:
            tools = kw_to_tools[tok]
            matched[tok] = tools
            candidate_tools |= tools

    # Simple score: count matched keywords, cap for stability
    score = min(5.0, float(len(matched)))

    return {
        "tool_score": score,
        "tool_keywords": sorted(matched.keys()),
        "candidate_tools": sorted(candidate_tools),
    }


tup, sett = build_tool_keyword_index(it)
