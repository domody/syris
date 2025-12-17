import asyncio
from syris_core.core.orchestrator import Orchestrator
from syris_core.types.events import Event, EventType
from syris_core.automation.scheduler import AutomationScheduler
from syris_core.automation.service import SchedulingService
from syris_core.util.logger import log
from syris_core.tools.agents.dev_input_agent import DevInputAgent

import datetime


async def main():
    log("core", "Booting System...")

    # Init orchestrator
    orch = Orchestrator()

    # Register global event handlers
    dev_agent = DevInputAgent(orch.event_bus)
    asyncio.create_task(dev_agent.start())

    # Start background agents
    scheduler = AutomationScheduler(orch.event_bus)
    scheduler.start()

    scheduling_service = SchedulingService(scheduler)
    orch.set_scheduling_service(scheduling_service=scheduling_service)

    # Listeners

    # Log
    log("core", "System Initialized.")
    log("core", "Entering main orchestration loop.")

    await orch.start()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        log("core", "Shutdown requested by user.")
