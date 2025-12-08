import asyncio
from syris_core.types.events import Event, EventType
from syris_core.util.logger import log

# Development-only console input agent for injecting INPUT events
class DevInputAgent:
    def __init__(self, event_bus):
        self.event_bus = event_bus
    
    async def start(self):
        log("test", "DevInputAgent Started. Type messages to send INPUT events.")

        while True:
            text = await asyncio.to_thread(input, ">")

            if not text.strip():
                continue

            log("test", f"Publishing INPUT event: {text}")

            event = Event(
                type=EventType.INPUT,
                user_id="dev",
                source="dev_console",
                payload={"text": text},
                timestamp=1
            )

            await self.event_bus.publish(event)