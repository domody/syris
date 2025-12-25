import asyncio
from syris_core.core.orchestrator import Orchestrator
from syris_core.types.events import Event, EventType
from syris_core.automation.scheduler import AutomationScheduler
from syris_core.automation.service import SchedulingService
from syris_core.util.logger import log
from syris_core.tools.agents.dev_input_agent import DevInputAgent
from syris_core.home_assistant.client import TestHomeAssistantClient
from syris_core.home_assistant.executor import ControlExecutor
from syris_core.home_assistant.target_resolver import TargetResolver
from syris_core.home_assistant.registry.service_catalog import ServiceCatalog

async def main():
    log("core", "Booting System...")

    # Init pre-req
    target_resolver = TargetResolver()
    ha = TestHomeAssistantClient()
    service_catalog = await ServiceCatalog.build(ha=ha)
    executor = ControlExecutor(ha=ha, resolver=target_resolver, catalog=service_catalog)

    # Init orch
    orch = Orchestrator(control_executor=executor)

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
