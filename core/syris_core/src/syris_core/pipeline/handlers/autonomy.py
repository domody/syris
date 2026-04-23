"""Fastpath handler for autonomy level management."""
import logging
import re

from ...observability.audit import AuditWriter
from ...safety.autonomy import AutonomyService
from ...schemas.events import MessageEvent
from ...schemas.pipeline import RouteDecision
from ..executor import PipelineHandler

logger = logging.getLogger(__name__)

_LEVEL_RE = re.compile(r"\bA[0-4]\b", re.I)


def make_autonomy_set_handler(
    autonomy_service: AutonomyService,
    audit: AuditWriter,
) -> PipelineHandler:
    """Handler for autonomy.set: sets system-wide autonomy level (A0–A4)."""

    async def handler(event: MessageEvent, decision: RouteDecision) -> str:
        m = _LEVEL_RE.search(event.content)
        level = m.group().upper() if m else event.structured.get("level")
        if not level:
            return "Autonomy level missing from request (expected A0–A4)"

        await autonomy_service.set_level(level, updated_by="pipeline")

        await audit.emit(
            event.trace_id,
            stage="autonomy",
            type="autonomy.set",
            summary=f"Autonomy level set to {level} via pipeline",
            outcome="success",
            ref_event_id=event.event_id,
        )
        return f"Autonomy level set to {level}"

    return handler
