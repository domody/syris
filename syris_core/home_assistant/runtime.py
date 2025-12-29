import asyncio
import time
from dataclasses import dataclass
from typing import Callable, Optional, Awaitable

from syris_core.events.bus import EventBus
from syris_core.types.events import Event, EventType
from syris_core.types.home_assistant import EntityState
from syris_core.home_assistant.interface import HomeAssistantInterface
from syris_core.home_assistant.registry.state_registry import StateRegistry
from syris_core.util.logger import log

@dataclass
class HomeAssistantRuntime:
    ha: HomeAssistantInterface
    state_registry: StateRegistry
    event_bus: EventBus
    resync_interval_s: int = 300 
    
    _stop: asyncio.Event = asyncio.Event()

    def stop(self) -> None:
        self._stop.set()

    async def _publish_device_event(self, state: EntityState) -> None:
        payload = {
            "entity_id": state.entity_id,
            "domain": state.domain,
            "state": state.state,
            "name": state.friendly_name,
        }
        await self.event_bus.publish(Event(
            type=EventType.DEVICE,
            source="home_assistant",
            payload=payload,
            timestamp=time.time(),
        ))

    async def _on_state_change(self, state: EntityState) -> None:
        self.state_registry.upsert(state=state)
        await self._publish_device_event(state=state)
        
    async def _periodic_resync(self) -> None:
        while not self._stop.is_set():
            try: 
                await asyncio.wait_for(self._stop.wait(), timeout=self.resync_interval_s)
                break
            except asyncio.TimeoutError:
                pass

            try:
                fresh = await StateRegistry.build(ha=self.ha)

                self.state_registry._states = fresh._states
                log("ha", "State registry resynced")
            except Exception as e:
                log("ha", f"State registry resync failed: {e}")

    async def _ws_loop(self) -> None:
        backoff = 0.5
        max_backoff = 10

        while not self._stop.is_set():
            try:
                log("ha", "Connecting websocket / subscribing to state changes...")
                await self.ha.subscribe_state_changes(self._on_state_change)
            
                log("ha", "Websocket ended; Reconnecting soon...")
            except asyncio.CancelledError:
                raise
            except Exception as e:
                log("ha", f"Websocket error: {e}")

            try:
                await asyncio.wait_for(self._stop.wait(), timeout=backoff)
                break
            except asyncio.TimeoutError:
                backoff = min(max_backoff, backoff * 2)
            
        log("ha", "Websocket loop stopped")

    async def run(self) -> None:
        self._stop.clear()
        log("ha", "HomeAssistantRuntime starting")

        try: 
            async with asyncio.TaskGroup() as tg:
                tg.create_task(self._ws_loop())
                tg.create_task(self._periodic_resync())
                tg.create_task(self._stop.wait())
        except* asyncio.CancelledError:
            pass
        except* Exception as eg:
            log("ha", f"HomeAssistantRuntime crashed: {eg}")
            raise
        finally:
            log("ha", "HomeAssistantRuntime stopped")

        

