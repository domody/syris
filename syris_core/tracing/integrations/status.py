import asyncio
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Optional, Tuple

from syris_core.types.events import Event, EventType
from syris_core.events.bus import EventBus
from syris_core.util.logger import log
from syris_core.tracing.models.integration import IntegrationState, IntegrationError

class IntegrationStatus:
    def __init__(self, event_bus: EventBus) -> None:
        self._states: dict[str, IntegrationState] = {}
        event_bus.subscribe(EventType.SYSTEM, self._on_system_event)

    def _on_system_event(self, event: Event) -> None:
        payload = event.payload or {}
        if payload.get("kind") != "integration.health":
            return
        
        integration_id = payload.get("integration_id")
        patch = payload.get("patch") or {}
        if not integration_id or not isinstance(patch, dict):
            return
        
        state = self._states.get(integration_id)
        if state is None:
            state = IntegrationState(integration_id=integration_id)
            self._states[integration_id] = state

        # ignore stale events
        if event.timestamp < state.last_event_ts:
            return
        
        try:
            self._apply_patch(state, patch)
            state.last_event_ts = event.timestamp
        except Exception as e:
            # log("")
            pass
        
    def _apply_patch(self, state: IntegrationState, patch: dict[str, Any]) -> None:
        for k in ("connected", "ws_alive", "auth_ok", "latency_ms"):
            if k in patch:
                setattr(state, k, patch[k])

        if "permissions" in patch and isinstance(patch["permissions"], dict):
            state.permissions.update({k: bool(v) for k, v in patch["permissions"].items()})

        if "last_error" in patch:
            le = patch["last_error"]
            if le is None:
                state.last_error = None
            elif isinstance(le, dict):
                state.last_error = IntegrationError(
                    code=str(le.get("code") or "unknown_error"),
                    message=(None if le.get("message") is None else str(le.get("message")))
                )
            
        if "details" in patch and isinstance(patch["details"], dict):
            state.details.update(patch["details"])

    def get_snapshot(self) -> dict[str, dict[str, Any]]:
        return {k: v.to_snapshot_dict() for k, v in self._states.items()}
    
    def check(self, requirement: str) -> Tuple[bool, Optional[str]]:
        try:
            integration_id, path = requirement.split(".", 1)
        except ValueError:
            return False, "invalid_requirement_format"

        state = self._states.get(integration_id)
        if not state:
            return False, "integration_unknown"

        if path == "connected":
            return (state.connected is True), (None if state.connected is True else "not_connected")
        if path == "ws_alive":
            return (state.ws_alive is True), (None if state.ws_alive is True else "ws_not_alive")
        if path == "auth_ok":
            return (state.auth_ok is True), (None if state.auth_ok is True else "auth_not_ok")
        if path.startswith("permissions."):
            perm = path.split(".", 1)[1]
            ok = state.permissions.get(perm)
            return (ok is True), (None if ok is True else f"permission_denied:{perm}")

        # allow checking details.foo
        if path.startswith("details."):
            key = path.split(".", 1)[1]
            val = state.details.get(key)
            return (val is True), (None if val is True else f"detail_not_true:{key}")

        return False, f"unknown_requirement:{path}"