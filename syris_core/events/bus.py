from typing import Callable, Dict, List, Coroutine, Any
from syris_core.types.events import Event, EventType

class EventBus:
    def __init__(self, dispatch_event: Callable[[Event], Coroutine]):
        self._subscribers: Dict[EventType, List[Callable[[Event], Any]]] = {}
        self._dispatch_event = dispatch_event

    # Subscribe to a callback to a specific event type
    def subscribe(self, event_type: EventType, callback: Callable[[Event], Any]):
        self._subscribers.setdefault(event_type, []).append(callback)

    # Publish a new event into the system
    async def publish(self, event: Event):
        for callback in self._subscribers.get(event.type, []):
            callback(event)

        await self._dispatch_event(event)