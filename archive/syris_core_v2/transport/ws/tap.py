import asyncio
from typing import Optional

from ..models.events import TransportEvent
from .normalize import normalize_internal_event
from .history import EventHistory
from .hub import Hub
from syris_core.events.bus import EventBus
from ...types.events import Event, EventType

class EventTap:
    def __init__(self, *, event_bus: EventBus, hub: Hub, history: EventHistory, max_buffer: int = 5000):
        self.event_bus = event_bus
        self.hub = hub
        self.history = history

        self._buffer: asyncio.Queue[Event] = asyncio.Queue(maxsize=max_buffer)
        self._task: Optional[asyncio.Task] = None
        self._stopping = asyncio.Event()

        self.dropped = 0

    async def start(self) -> None:
        self._stopping.clear()

        for et in EventType:
            self.event_bus.subscribe(et, self._on_event)

        self._task = asyncio.create_task(self._run(), name="ws_event_loop")

    async def stop(self) -> None:
        self._stopping.set()
        if self._task:
            self._task.cancel()
            try: 
                await self._task
            except Exception:
                pass

    def _on_event(self, event: Event):
        if self._stopping.is_set():
            return
        
        try:
            self._buffer.put_nowait(event)
        except asyncio.QueueFull:
            self._dropped += 1
            # can optionally emit a SYSTEM/LOG event about drops, but keep it light.

    async def _run(self) -> None:
        while not self._stopping.is_set():
            ev = await self._buffer.get()

            te: TransportEvent | None = normalize_internal_event(ev)
            if te is None:
                continue

            self.history.add(te)
            await self.hub.publish(te)