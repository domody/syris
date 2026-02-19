import asyncio
import time
import random

from syris_core.events.bus import EventBus
from syris_core.types.events import Event, EventType

class IntegrationSupervisor:
    def __init__(
            self,
            *,
            integration_id: str,
            event_bus: EventBus,
            init_fn,
            run_fn,
    ):
        self.integration_id = integration_id
        self.event_bus = event_bus
        self.init_fn = init_fn
        self.run_fn = run_fn
        self._stop = asyncio.Event()

    def stop(self): self._stop.set()

    async def _publish_health_event(self, patch: dict) -> None:
        await self.event_bus.publish(Event(
            type=EventType.SYSTEM,
            source=self.integration_id,
            payload={
                "kind": "integration.health",
                "integration_id": self.integration_id,
                "patch": patch
            },
            timestamp=time.time()
        ))

    async def run(self):
        backoff = 0.5
        while not self._stop.is_set():
            try:
                await self._publish_health_event({"connected": False, "details": {"phase": "initializing"}})
                await self.init_fn()
                await self._publish_health_event({"connected": True, "last_error": None, "details": {"phase": "connected"}})

                await self.run_fn() # func blocks loop until disconnected or failure

                await self._publish_health_event({"connected": False, "ws_alive": False, "last_error": {"code": "disconnected"}})

            except asyncio.CancelledError:
                raise
            except Exception as e:
                await self._publish_health_event({
                    "connected": False,
                    "ws_alive": False,
                    "last_error": {
                        "code": "integration_error",
                        "message": str(e)
                    }
                })

            jitter = 1 + random.uniform(-0.15, 0.15)
            delay = min(10.0, backoff) * jitter
            backoff = min(10.0, backoff * 2)

            try:
                await asyncio.wait_for(self._stop.wait(), timeout=delay)
            except asyncio.TimeoutError:
                pass


