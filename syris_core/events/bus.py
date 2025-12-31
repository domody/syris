import asyncio
from typing import Callable, Dict, List, Coroutine, Any
from syris_core.types.events import Event, EventType
from syris_core.util.logger import log

class EventBus:
    def __init__(self):
        self._subscribers: Dict[EventType, List[Callable[[Event], Any]]] = {}
        self._queue = asyncio.Queue()

    # Subscribe to a callback to a specific event type
    def subscribe(self, event_type: EventType, callback: Callable[[Event], Any]):
        self._subscribers.setdefault(event_type, []).append(callback)

    # Publish a new event into the system
    async def publish(self, event: Event):
        for callback in self._subscribers.get(event.type, []):
            try:
                callback(event)
            except Exception as e:
                log("event_bus", f"Subscriber error for {event.type}: {e}")
        await self._queue.put(event)

    async def next_event(self) -> Event:
        return await self._queue.get()

    def task_done(self):
        self._queue.task_done()
