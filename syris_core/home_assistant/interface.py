from typing import Protocol, Any, Callable, Awaitable, Optional
from syris_core.types.home_assistant import EntityState
from syris_core.events.bus import EventBus

class HomeAssistantInterface(Protocol):
    event_bus: EventBus
    
    async def list_entities(self) -> list[EntityState]: ...

    async def list_services(self) -> list[Any]: ...

    async def get_state(self, entity_id: str) -> EntityState: ...

    async def call_service(self, *, domain: str, service: str, data: dict) -> Any: ...

    async def subscribe_state_changes(
        self, callback: Callable[[Optional[EntityState], EntityState], Awaitable[None]]
    ) -> None: ...
