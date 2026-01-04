import time
from typing import Any
from collections import Counter

from syris_core.home_assistant.interface import HomeAssistantInterface
from syris_core.home_assistant.target_resolver import TargetResolver
from syris_core.home_assistant.registry.service_catalog import ServiceCatalog
from syris_core.home_assistant.registry.state_registry import StateRegistry
from syris_core.types.llm import ControlAction, QueryAction, Action
from syris_core.types.home_assistant import (
    EntityView,
    QueryResult,
    ControlResult,
    EntityState,
)
from syris_core.home_assistant.service_map import map_operation
from syris_core.util.logger import log
from syris_core.events.bus import EventBus
from syris_core.types.events import Event, EventType

def infer_expected_to_state(domain: str, service: str) -> str | None:
    # lights/switches
    if service in ("turn_on",):
        return "on"
    if service in ("turn_off",):
        return "off"

    # covers
    if service == "open_cover":
        return "open"
    if service == "close_cover":
        return "closed"

    # toggle / set_temperature / set_position etc are ambiguous here
    return None

class ControlExecutor:
    def __init__(
        self,
        ha: HomeAssistantInterface,
        resolver: TargetResolver,
        service_catalog: ServiceCatalog,
        state_registry: StateRegistry,
        event_bus: EventBus
    ):
        self.ha = ha
        self.resolver = resolver
        self.service_catalog = service_catalog
        self.state_registry = state_registry
        self.event_bus = event_bus

    async def execute_action(self, action: Action) -> Any:
        if isinstance(action, ControlAction):
            return await self.execute_control_action(action=action)

        elif isinstance(action, QueryAction):
            return await self.execute_query_action(action=action)

    async def execute_control_action(self, action: ControlAction) -> ControlResult:
        domain = (
            action.domain.value if hasattr(action.domain, "value") else action.domain
        )
        service = map_operation(domain, action.operation)

        # Validate service exists in HA
        self.service_catalog.require(domain, service)
        # tbd check for response key in json. If none -> dont send return response, If response: optional True or False, do send for return

        entities = self.state_registry.all()
        entity_ids = self.resolver.resolve(
            target=action.target, domain=domain, entities=entities
        )
        if not entity_ids:
            raise ValueError("No matching entities for target")

        expected_to = infer_expected_to_state(domain, service)
        expected: dict[str, dict[str, str | None]] = {}

        for eid in entity_ids:
            st = self.state_registry.get(eid)
            expected[eid] = {
                "from_state": st.state if st else None,
                "to_state": expected_to,
            }
            
        payload = dict(action.data)
        payload["entity_id"] = entity_ids
        log(
            "control",
            f"Calling HA Service with domain: {domain}, service: {service}, payload: {payload}",
        )

        # publish tool events
        tool_payload = {
            "kind": "ha.call_service",
            "phase": "start",
            "domain": domain,
            "service": service,
            "entity_ids": entity_ids,
            "expected": expected,
        }
        # start event
        start_event =Event(
            type=EventType.TOOL,
            source="control_executor",
            payload=tool_payload,
            timestamp=time.time()
        )

        await self.event_bus.publish(start_event)
        try:
            await self.ha.call_service(domain=domain, service=service, data=payload)
            await self.event_bus.publish(Event(
                type=EventType.TOOL, 
                source="control_executor",
                payload={**tool_payload, "phase": "success"}, 
                parent_event_id=start_event.event_id,
                timestamp=time.time()
            ))
            return ControlResult(
                domain=domain,
                operation=service,
                target=action.target,
                entity_ids=entity_ids,
                success=True,
            )

        except Exception as e:
            await self.event_bus.publish(Event(
                type=EventType.TOOL, 
                source="control_executor",
                payload={**tool_payload, "phase": "failure", "error": {
                    "type": type(e).__name__,
                    "message": str(e),
                    "retryable": True
                }}, 
                parent_event_id=start_event.event_id,
                timestamp=time.time()
            ))
            return ControlResult(
                domain=domain,
                operation=service,
                target=action.target,
                entity_ids=entity_ids,
                success=False,
            )

    async def execute_query_action(self, action: QueryAction):
        domain = (
            action.domain.value if hasattr(action.domain, "value") else action.domain
        )

        entities = self.state_registry.all()
        entity_ids = self.resolver.resolve(
            target=action.target, domain=domain, entities=entities
        )

        if not entity_ids:
            raise ValueError("No matching entities for target")

        selected = self.state_registry.snapshot(entity_ids=entity_ids)

        counts = Counter([e.state for e in selected])
        views = [self._entitiy_view(domain=domain, e=e) for e in selected]

        return QueryResult(
            domain=domain,
            query=getattr(action, "query", "state"),
            target=action.target,
            summary={"total": len(selected), "counts": dict(counts)},
            entities=views,
        )

    def _entitiy_view(self, domain: str, e: EntityState) -> EntityView:
        attrs = {}

        if domain == "light":
            if "brightness" in e.attributes:
                attrs["brightness"] = e.attributes["brightness"]
            if "color_mode" in e.attributes:
                attrs["color_mode"] = e.attributes["color_mode"]

        elif domain == "cover":
            if "current_position" in e.attributes:
                attrs["current_position"] = e.attributes["current_position"]

        elif domain == "climate":
            for k in ("current_temperature", "temperature", "hvac_mode", "hvac_action"):
                if k in e.attributes:
                    attrs[k] = e.attributes[k]

        #  switch / media player ...

        return EntityView(
            entity_id=e.entity_id,
            name=e.friendly_name,
            domain=domain,
            state=e.state,
            attributes=attrs,
        )
