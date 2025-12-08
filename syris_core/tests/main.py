import asyncio
from syris_core.core.orchestrator import Orchestrator
from syris_core.types.events import Event, EventType
from syris_core.events.handlers import log_input_event

async def main():
    # Init orchestrator
    orch = Orchestrator()

    # Subscribe a test handler
    orch.event_bus.subscribe(EventType.INPUT, log_input_event)

    # Start the orchestrator loop in the background
    loop_task = asyncio.create_task(orch.start())

    # Publish a few mock events
    print("[Test] Publishing INPUT event...")
    await orch.event_bus.publish(Event(
        id="uuid",
        type=EventType.INPUT,
        user_id="alice",
        source="test_harness",
        payload={"text": "Hello SYRIS"},
        timestamp=1
    ))

    await asyncio.sleep(0.5)

    print("[Test] Publishing TOOL event...")
    await orch.event_bus.publish(Event(
        id="uuid",
        type=EventType.TOOL,
        payload={"tool": "weather_api", "result": "sunny"},
        timestamp=1
    ))

    await asyncio.sleep(1)

    loop_task.cancel()  # stop orchestrator loop after test

asyncio.run(main())
