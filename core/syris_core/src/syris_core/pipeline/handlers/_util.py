"""Shared utilities for fastpath pipeline handlers."""
import re
from uuid import UUID

_UUID_RE = re.compile(
    r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
    re.I,
)


def _extract_uuid(content: str) -> UUID | None:
    m = _UUID_RE.search(content)
    return UUID(m.group()) if m else None


def _extract_identifier(content: str, keyword: str) -> str | None:
    """Return the token immediately after *keyword* in *content*, or None."""
    m = re.search(rf"{re.escape(keyword)}\s+(\S+)", content, re.I)
    return m.group(1) if m else None


def _parse_identifier(s: str) -> tuple[UUID | None, str | None]:
    """Determine whether *s* is a UUID or a name slug.

    Returns (uuid, None) for a valid UUID string, (None, s) otherwise.
    """
    try:
        return UUID(s), None
    except (ValueError, AttributeError):
        return None, s
