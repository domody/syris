import json
from typing import Any, Dict, Optional

from ..models.ids import EventId
from ..models.events import TransportEvent
from ..models.enums import EventKind, Level
from ...types.events import Event, EventType  # adjust import to your project


def _to_ms(ts_seconds: float) -> int:
    return int(ts_seconds * 1000)


def _safe_payload(payload: Any) -> Dict[str, Any]:
    # Ensure JSON-serializable (no objects / bytes / etc.)
    try:
        json.dumps(payload)
        return payload if isinstance(payload, dict) else {"value": payload}
    except Exception:
        return {"_repr": repr(payload)}


def _level_from_event(event: Event) -> Level:
    # Default levels
    if event.type == EventType.ERROR:
        return Level.ERROR

    # TOOL phase-based
    if event.type == EventType.TOOL:
        phase = (event.payload or {}).get("phase")
        if phase == "failure":
            return Level.ERROR
        if phase == "start":
            return Level.DEBUG
        return Level.INFO

    return Level.INFO


def normalize_internal_event(event: Event) -> Optional[TransportEvent]:
    payload = _safe_payload(event.payload or {})
    kind = EventKind(event.type.value)  # since we aligned enums with internal values
    level = _level_from_event(event)

    entity_id = payload.get("entity_id")
    tool_name = None
    integration_id = None
    schema = None

    # Get request ID
    request_id = event.request_id
    if request_id is None:
        rid = payload.get("request_id")
        if isinstance(rid, str) and rid:
            request_id = rid

    # TOOL normalization hints
    if event.type == EventType.TOOL:
        tool_name = payload.get("kind")  # e.g. "ha.call_service"
        # could also set entity_id from args if present later

    # SYSTEM sub-kinds
    if event.type == EventType.SYSTEM:
        p_kind = payload.get("kind")
        if p_kind == "trace.link":
            schema = "trace.link.v1"
        elif p_kind == "integration.health":
            schema = "integration.health.v1"
            integration_id = payload.get("integration_id")

    return TransportEvent(
        id=EventId(event.event_id or "missing_event_id"),
        ts_ms=_to_ms(event.timestamp),
        kind=kind,
        level=level,
        trace_id=event.trace_id,
        request_id=request_id,
        parent_event_id=event.parent_event_id,
        entity_id=entity_id,
        user_id=event.user_id,
        source=event.source,
        tool_name=tool_name,
        integration_id=integration_id,
        schema=schema,
        payload=payload,
    )
