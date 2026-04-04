"""
DryRunProtocol — preview support for tools that declare supports_preview.

When the gate matrix returns PREVIEW (A0 suggest-only) or the gate flow
requests a preview before CONFIRM, the tool executor calls tool.preview()
via this protocol and returns a PreviewResult without executing the action.

Execution after preview reuses the same idempotency_key to prevent duplicate
side effects.
"""
from typing import Any, Optional

from pydantic import BaseModel


class PreviewResult(BaseModel):
    """Result of a tool dry-run preview."""

    tool_name: str
    action: str
    idempotency_key: str
    summary: str
    diff: Optional[dict[str, Any]] = None
    supported: bool = True

    model_config = {"frozen": True}


class UnsupportedPreview(PreviewResult):
    """Returned when a tool does not support dry-run preview."""

    supported: bool = False
    summary: str = "This tool does not support dry-run preview."
