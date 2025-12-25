from typing import Any
from collections import Counter

from syris_core.home_assistant.interface import HomeAssistantInterface
from syris_core.home_assistant.target_resolver import TargetResolver
from syris_core.home_assistant.registry.service_catalog import ServiceCatalog
from syris_core.types.llm import ControlAction, QueryAction, Action
from syris_core.types.home_assistant import EntityView, QueryResult, ControlResult, EntityState
from syris_core.home_assistant.service_map import map_operation
from syris_core.util.logger import log

class ControlExecutor:
    def __init__(
        self,
        ha: HomeAssistantInterface,
        resolver: TargetResolver,
        catalog: ServiceCatalog,
    ):
        self.ha = ha
        self.resolver = resolver
        self.catalog = catalog

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
        self.catalog.require(domain, service)
        # tbd check for response key in json. If none -> dont send return response, If response: optional True or False, do send for return
        entities = await self.ha.list_entities()  # tb cached
        entity_ids = self.resolver.resolve(
            target=action.target, domain=domain, entities=entities
        )
        if not entity_ids:
            raise ValueError("No matching entities for target")

        payload = dict(action.data)
        payload["entity_id"] = entity_ids
        log("control", f"Calling HA Service with domain: {domain}, service: {service}, payload: {payload}")
        await self.ha.call_service(domain=domain, service=service, data=payload)
        
        return ControlResult(
            domain=domain,
            operation=service,
            target=action.target,
            entity_ids=entity_ids,
            success=True
        ) 

    async def execute_query_action(self, action: QueryAction):
        domain = (
            action.domain.value if hasattr(action.domain, "value") else action.domain
        )

        entities = await self.ha.list_entities()  # tb cached
        entity_ids = self.resolver.resolve(
            target=action.target, domain=domain, entities=entities
        )

        if not entity_ids:
            raise ValueError("No matching entities for target")

        selected = [e for e in entities if e.entity_id in set(entity_ids)]

        counts = Counter([e.state for e in selected])
        views = [self._entitiy_view(domain=domain, e=e) for e in selected]

        return QueryResult(
            domain=domain,
            query=getattr(action, "query", "state"),
            target=action.target,
            summary={
                "total": len(selected),
                "counts": dict(counts)
            },
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
            entity_id= e.entity_id,
            name= e.friendly_name,
            domain= domain,
            state= e.state,
            attributes= attrs,
        )
