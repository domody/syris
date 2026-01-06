import re

_WORD_RE = re.compile(r"[a-z0-9]+")
_WS_RE = re.compile(r"\s+")

def _tokens(s: str) -> list[str]:
    return _WORD_RE.findall(s.lower())

def _normalize_phrase(s: str) -> str:
    return _WS_RE.sub(" ", s.strip().lower())