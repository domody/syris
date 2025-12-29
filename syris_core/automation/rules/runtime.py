import asyncio
from dataclasses import dataclass

from syris_core.events.bus import EventBus
from syris_core.types.events import Event, EventType
from syris_core.automation.rules.engine import RuleEngine
from syris_core.util.logger import log

@dataclass
class RulesRuntime:
    event_bus: EventBus
    engine: RuleEngine

    def start(self) -> None:
        log("rules", "RulesRuntime subscribing to DEVICE events")

        def _on_device_event(event: Event):
            asyncio.create_task(self.engine.handle_event(event=event))

        self.event_bus.subscribe(event_type=EventType.DEVICE, callback=_on_device_event)