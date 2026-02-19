import asyncio
import uuid
import inspect

from typing import Callable, Dict, List, Coroutine, Any
from syris_core.types.events import Event, EventType
from syris_core.util.logger import log
from syris_core.tracing.context.request_context import TRACE_CTX

class EventBus:
    def __init__(self):
        self._subscribers: Dict[EventType, List[Callable[[Event], Any]]] = {}
        self._queue = asyncio.Queue()

    # Subscribe to a callback to a specific event type
    def subscribe(self, event_type: EventType, callback: Callable[[Event], Any]):
        self._subscribers.setdefault(event_type, []).append(callback)

    # Publish a new event into the system
    async def publish(self, event: Event):
        # assign unique event id
        if event.event_id is None:
            event.event_id = str(uuid.uuid4())

        ctx = TRACE_CTX.get()

        # inherit trace id from context or create new one
        if event.trace_id is None:
            event.trace_id = ctx.trace_id or str(uuid.uuid4())

        # if input event, create new request id
        # else inherit it from context if present
        if event.request_id is None:
            if event.type == EventType.INPUT:
                event.request_id = ctx.request_id or str(uuid.uuid4())
            else:
                event.request_id = ctx.request_id

        # inherit from context
        # if event.parent_event_id is None:
        #     event.parent_event_id = ctx.parent_event_id
        
        for callback in self._subscribers.get(event.type, []):
            try:
                result = callback(event)
                if inspect.isawaitable(result):
                    await result

            except Exception as e:
                log("event_bus", f"Subscriber error for {event.type}: {e}")

        await self._queue.put(event)

    async def next_event(self) -> Event:
        return await self._queue.get()

    def task_done(self):
        self._queue.task_done()
