from typing import Any, Iterable

def _lower(s: Any) -> str:
    return str(s or "").strip().lower()


def _deep_merge(base: dict, patch: dict) -> dict:
    """Recursive dict merge where patch wins."""
    out = dict(base)
    for k, v in patch.items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _deep_merge(out[k], v)
        else:
            out[k] = v
    return out


def _get(args: dict, path: str, default=None):
    cur = args
    for part in path.split("."):
        if not isinstance(cur, dict) or part not in cur:
            return default
        cur = cur[part]
    return cur


def _set(patch: dict, path: str, value: Any) -> dict:
    cur = patch
    parts = path.split(".")
    for p in parts[:-1]:
        cur = cur.setdefault(p, {})
    cur[parts[-1]] = value
    return patch


def _has_any_phrase(text: str, phrases: Iterable[str]) -> bool:
    t = _lower(text)
    return any(p in t for p in phrases)


def _as_enum_value(v: Any) -> str:
    """
    Accept enum instances or strings and return the raw value string.
    e.g. ControlOperation.POWER_OFF -> "power_off"
    """
    if hasattr(v, "value"):
        return str(v.value)
    return str(v)