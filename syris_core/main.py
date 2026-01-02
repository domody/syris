import asyncio
from syris_core.events.bus import EventBus
from syris_core.core.orchestrator import Orchestrator
from syris_core.types.home_assistant import EntityState
from syris_core.automation.scheduling.scheduler import AutomationScheduler
from syris_core.automation.scheduling.service import SchedulingService
from syris_core.util.logger import log
from syris_core.tools.agents.dev_input_agent import DevInputAgent
from syris_core.home_assistant.client import TestHomeAssistantClient
from syris_core.home_assistant.executor import ControlExecutor
from syris_core.home_assistant.target_resolver import TargetResolver
from syris_core.home_assistant.registry.service_catalog import ServiceCatalog
from syris_core.home_assistant.registry.state_registry import StateRegistry
from syris_core.home_assistant.runtime import HomeAssistantRuntime
from syris_core.automation.rules.storage.memory import load_rules
from syris_core.automation.rules.registry import RuleRegistry
from syris_core.automation.rules.engine import RuleEngine
from syris_core.automation.rules.runtime import RulesRuntime
from syris_core.notifications.notifier import NotifierAgent


async def main():
    log("core", "Booting System...")

    event_bus = EventBus()

    # Home Assistant
    target_resolver = TargetResolver()
    ha = TestHomeAssistantClient()

    service_catalog = await ServiceCatalog.build(ha=ha)
    state_registry = await StateRegistry.build(ha=ha)

    ha_runtime = HomeAssistantRuntime(
        ha=ha, state_registry=state_registry, event_bus=event_bus, resync_interval_s=300
    )
    ha_task = asyncio.create_task(ha_runtime.run())

    executor = ControlExecutor(
        ha=ha,
        resolver=target_resolver,
        service_catalog=service_catalog,
        state_registry=state_registry,
    )

    # Rule-based automations
    rules = load_rules()
    rules_registry = RuleRegistry.build(rules=rules)
    rules_engine = RuleEngine(registry=rules_registry, control_executor=executor, event_bus=event_bus)
    rules_runtime = RulesRuntime(event_bus=event_bus, engine=rules_engine)
    rules_runtime.start()

    # Notification System
    notifier = NotifierAgent(event_bus=event_bus)
    notifier.start()
    
    # Init orch
    orch = Orchestrator(control_executor=executor, event_bus=event_bus)

    # Register global event handlers
    dev_agent = DevInputAgent(orch.event_bus)
    dev_task = asyncio.create_task(dev_agent.start())

    # Start background agents
    scheduler = AutomationScheduler(orch.event_bus)
    scheduler.start()
    scheduling_service = SchedulingService(scheduler)
    orch.set_scheduling_service(scheduling_service=scheduling_service)

    # Listeners

    # Log
    log("core", "System Initialized.")
    log("core", "Entering main orchestration loop.")

    try:
        await orch.start()
    finally:
        ha_runtime.stop()
        ha_task.cancel()
        dev_task.cancel()
        await asyncio.gather(ha_task, dev_task, return_exceptions=True)
        log("core", "Shutdown complete")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        log("core", "Shutdown requested by user.")
