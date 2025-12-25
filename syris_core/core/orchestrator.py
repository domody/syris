import asyncio
from datetime import datetime
from zoneinfo import ZoneInfo
from pathlib import Path
import json

from syris_core.core.config import OrchestratorConfig
from syris_core.llm.provider import LLMProvider
from syris_core.llm.processors.intent_parser import IntentParser
from syris_core.llm.processors.plan_generator import Planner
from syris_core.llm.processors.response_composer import ResponseComposer
from syris_core.types.events import Event, EventType
from syris_core.types.task import Automation
from syris_core.types.llm import (
    Intent,
    IntentType,
    Plan,
    PlanExecutionResult,
    ScheduleAction,
    ScheduleArgs,
    ScheduleSetArgs,
    ScheduleIntent,
    ChatIntent,
    ToolIntent,
    ControlIntent,
    ControlArgs,
    ControlAction,
    QueryAction,
    ControlDomain,
    ControlOperation,
    TargetSpec,
)
from syris_core.types.home_assistant import QueryResult, ControlResult
from syris_core.automation.service import SchedulingService
from syris_core.types.memory import MemorySnapshot
from syris_core.events.bus import EventBus
from syris_core.memory.working_memory import WorkingMemory
from syris_core.execution.plan_executor import PlanExecutor
from syris_core.core.tool_runner import ToolRunner
from syris_core.core.scheduling_factory import build_automation, build_trigger
from syris_core.tools.registry import TOOL_REGISTRY, TOOL_PROMPT_LIST
from syris_core.util.logger import log
from syris_core.util.helpers import assert_intent_type
from syris_core.home_assistant.executor import ControlExecutor

PROMPTS_DIR = Path(__file__).resolve().parents[1] / "llm" / "prompts"


class Orchestrator:
    def __init__(self, control_executor: ControlExecutor):
        self.config = OrchestratorConfig()

        # Memory
        self.working_memory = WorkingMemory()

        # LLM Layer
        intent_prompt = open(PROMPTS_DIR / self.config.intent_prompt_file).read()
        plan_prompt = open(PROMPTS_DIR / self.config.planning_prompt_file).read()
        response_prompt = open(PROMPTS_DIR / self.config.system_prompt_file).read()

        provider = LLMProvider(model_name=self.config.model_name)
        self.intent_parser = IntentParser(
            provider=provider,
            system_prompt=intent_prompt.replace(
                "{TOOL_PROMPT_LIST}", TOOL_PROMPT_LIST.strip()
            ),
        )
        self.planner = Planner(
            provider=provider,
            system_prompt=plan_prompt.replace(
                "{TOOL_PROMPT_LIST}", TOOL_PROMPT_LIST.strip()
            ),
        )
        self.response_composer = ResponseComposer(
            provider=provider, system_prompt=response_prompt
        )

        # Event queue
        self._event_queue = asyncio.Queue()
        self.event_bus = EventBus(self.dispatch_event)
        self._sem_events = asyncio.Semaphore(self.config.max_concurrent_events)
        self._tasks: set[asyncio.Task] = set()

        # Execution
        self.plan_executor = PlanExecutor()
        self.tool_runner = ToolRunner(TOOL_REGISTRY)

        # Scheduling
        self.scheduling_service: SchedulingService | None = None

        # Dispatch Maps
        self._event_handlers = {
            EventType.INPUT: self._handle_input,
            EventType.SCHEDULE: self._handle_automation,
        }

        self._intent_handlers = {
            IntentType.CHAT: self._handle_chat,
            IntentType.TOOL: self._handle_tool,
            IntentType.PLAN: self._handle_plan,
            IntentType.SCHEDULE: self._handle_schedule,
            IntentType.CONTROL: self._handle_control,
        }

        # Home Assistant
        self.control_executor = control_executor

    # Main loop
    async def start(self):
        log("orchestrator", "Started event loop.")

        while True:
            event = await self._event_queue.get()
            task = asyncio.create_task(self._handle_event_with_limits(event))
            self._tasks.add(task)

            def _done(t: asyncio.Task):
                self._tasks.discard(t)
                try:
                    t.result()
                except Exception as e:
                    log("orchestrator", f"Unhandled task error: {e}")
                finally:
                    self._event_queue.task_done()

            task.add_done_callback(_done)

    async def _handle_event_with_limits(self, event: Event):
        async with self._sem_events:
            await self._handle_event_safe(event=event)

    async def _handle_event_safe(self, event: Event):
        try:
            await self.handle_event(event)
        except Exception as e:
            log("orchestrator", f"Error handling event {event.type}: {e}")

    # Handle event based on event type
    async def handle_event(self, event: Event):
        log("orchestrator", f"Handling event: {event.type} -> {event.payload}")

        handler = self._event_handlers.get(event.type, self._handle_unknown_event)
        return await handler(event)

    async def _handle_unknown_event(self, event: Event):
        await self._emit_response(f"Unknown Event: {event}")

    def set_scheduling_service(self, scheduling_service: SchedulingService):
        self.scheduling_service = scheduling_service

    def require_scheduling_service(self) -> SchedulingService:
        if not self.scheduling_service:
            raise RuntimeError("SchedulingService not initialized on Orchestrator")
        return self.scheduling_service

    # Add event to event queue, called by EventBus
    async def dispatch_event(self, event: Event):
        await self._event_queue.put(event)

    # Emit response
    async def _emit_response(self, text: str):
        log("core", f"{text}")

    # Handle input events
    async def _handle_input(self, event: Event):
        user_text = event.payload["text"]

        # add user text to memory first
        self.working_memory.add(role="user", content=user_text)

        snap = self.working_memory.snapshot(scopes=["chat"])

        intent = await self.intent_parser.parse(user_text, snap)

        # intent = Intent(
        #     ControlIntent(
        #         type=IntentType.CONTROL,
        #         subtype="ha.service_call_plan",
        #         confidence=0.85,
        #         arguments=ControlArgs(
        #             actions=[
        #                 # ControlAction(
        #                 #     domain=ControlDomain.LIGHT,
        #                 #     operation=ControlOperation.POWER_TOGGLE,
        #                 #     target=TargetSpec(
        #                 #         scope="home",
        #                 #         selector="all",
        #                 #         area=None,
        #                 #         name=None,
        #                 #         entity_ids=[],
        #                 #     ),
        #                 #     data={},
        #                 #     requires_confirmation=False,
        #                 # )
        #                 QueryAction(
        #                     domain=ControlDomain.LIGHT,
        #                     target=TargetSpec(
        #                         scope="home",
        #                         selector="all",
        #                         area=None,
        #                         name=None,
        #                         entity_ids=[],
        #                     ),
        #                 )
        #             ]
        #         ),
        #     )
        # )

        reply = await self._route_intent(intent=intent, user_text=user_text, snap=snap)

        if reply is not None:
            self.working_memory.add(role="assistant", content=reply)
            await self._emit_response(reply)

    # Handle scheduled events
    async def _handle_automation(self, event: Event):
        automation: Automation = event.payload["automation"]
        if automation.mode == "plan":
            plan: Plan = automation.plan
            result: PlanExecutionResult = await self.plan_executor.execute(
                user_text="No user text available; Plan generated from automation.",
                plan=plan,
            )

            assert not result.status == "in_progress"

            # generate plan summary with no memory as automated plans should be independnt of recent working memory
            response = await self.response_composer.compose_plan_summary(
                snap=None, result=result
            )

            self.working_memory.add(
                role="assistant", scope="automation", content=response
            )
            await self._emit_response(response)

        elif automation.mode == "prompt":
            await self._handle_input(
                Event(
                    type=EventType.SCHEDULE,
                    user_id=event.user_id,
                    source=event.source,
                    payload={"text": automation.text},
                    timestamp=event.timestamp,
                )
            )

        elif automation.mode == "timer":
            log("core", "Your timer is done.")

        elif automation.mode == "alarm":
            log("core", "Your alarm has been triggered.")

    # Route to correct handler based on intent type
    async def _route_intent(
        self, intent: Intent, user_text: str, snap: MemorySnapshot
    ) -> str | None:
        handler = self._intent_handlers.get(
            intent.root.type, self._handle_unknown_intent
        )
        return await handler(intent, user_text, snap)

    def _handle_unknown_intent(self):
        return "Apologies, that intent type is not set up for routing yet."

    async def _handle_chat(self, intent: Intent, user_text: str, snap: MemorySnapshot):
        return await self.response_composer.compose(snap=snap)

    async def _handle_tool(self, intent: Intent, user_text, snap: MemorySnapshot):
        intent_obj = assert_intent_type(intent=intent, expected_type=ToolIntent)

        tool_names = intent_obj.subtype

        log(
            "orchestrator",
            f"Handling tools {tool_names} with arguments {intent_obj.arguments}",
        )

        _, tool_messages = await self.tool_runner.run_tools(
            tool_names=tool_names, args=intent_obj.arguments
        )

        reply = await self.response_composer.compose(
            snap=snap, extra_messages=tool_messages
        )

        # persist tool messages
        for m in tool_messages:
            self.working_memory.add(
                role=m["role"], content=m["content"], tool_name=m.get("tool_name")
            )

        return reply

    async def _handle_plan(self, intent: Intent, user_text, snap: MemorySnapshot):
        optimistic = await self.response_composer.compose_optimistic(snap=snap)
        await self._emit_response(optimistic)

        asyncio.create_task(
            self._execute_plan_async(intent=intent, user_text=user_text, snap=snap)
        )
        return None

    async def _execute_plan_async(
        self, intent: Intent, user_text: str, snap: MemorySnapshot
    ):
        plan = await self.planner.generate()

        result: PlanExecutionResult = await self.plan_executor.execute(
            user_text=user_text, plan=plan
        )

        assert not result.status == "in_progress"

        response = await self.response_composer.compose_plan_summary(
            result=result, snap=snap
        )

        self.working_memory.add(role="assistant", content=response)
        await self._emit_response(response)

    async def _handle_schedule(
        self, intent: Intent, user_text: str, snap: MemorySnapshot
    ):
        intent_obj = assert_intent_type(intent=intent, expected_type=ScheduleIntent)

        if not isinstance(intent_obj, ScheduleIntent):
            return

        if intent_obj.arguments.subtype != ScheduleAction.SET:
            return

        args = intent_obj.arguments

        if not isinstance(args, ScheduleSetArgs):
            raise TypeError(f"Schedule arguments are of incorrect type: {type(args)!r}")

        tz = ZoneInfo(self.config.tz_name)
        now = datetime.now(tz=tz)
        trigger = build_trigger(args=args, now=now, tz=tz)
        automation = build_automation(args=args, trigger=trigger)

        log("core", f"{automation}")

        scheduler = self.require_scheduling_service()
        await scheduler.add_automation(automation=automation)
        # await self._emit_response("Yes sir.")
        return "Yes sir."

    async def _handle_control(
        self, intent: Intent, user_text: str, snap: MemorySnapshot
    ):
        QUERY_INSTRUCTIONS = (
            "Use ONLY the tool result to answer. Do not invent entities or states."
            "Do NOT mention any internal limits or phrases like 'up to 5'."
            "Decision rule for mentioning device names:\n- If ALL relevant devices share the same state (e.g. all off, all on), say the single-sentence summary only. Do NOT list device names.\n- If states are mixed, summarize first (counts or “most are…”), then mention ONLY the exceptions (the devices that break the majority pattern), by name and state.\n- If any devices are unavailable/unknown, mention those by name.\n- If the user asked about a specific device name or a subset, mention only those relevant devices."
            "Keep the entire reply concise."
        )

        MIXED_INSTRUCTIONS = (
            "Use ONLY the tool result to answer. Do not invent entities or states."
            "First, briefly acknowledge the control actions from home_assistant_control (one short phrase)"
            "Then answer the home_assistant_query results using this rule"
            "Do NOT mention any internal limits or phrases like 'up to 5'."
            "Decision rule for mentioning device names:\n- If ALL relevant devices share the same state (e.g. all off, all on), say the single-sentence summary only. Do NOT list device names.\n- If states are mixed, summarize first (counts or “most are…”), then mention ONLY the exceptions (the devices that break the majority pattern), by name and state.\n- If any devices are unavailable/unknown, mention those by name.\n- If the user asked about a specific device name or a subset, mention only those relevant devices."
            "Keep the entire reply concise."
        )

        intent_obj = assert_intent_type(intent=intent, expected_type=ControlIntent)
        
        extra_messages = []
        had_control = False
        had_query = False

        control_results = []

        for action in intent_obj.arguments.actions:
            data = await self.control_executor.execute_action(action=action)
            
            if isinstance(action, QueryAction):
                had_query = True
                assert isinstance(data, QueryResult)
                extra_messages.append({
                    "role": "tool",
                    "tool_name": "home_assistant_query",
                    "content": data.model_dump_json()
                })

            elif isinstance(action, ControlAction):
                had_control = True
                assert isinstance(data, ControlResult)
                control_results.append(data)

        if had_control and not had_query:
            return await self.response_composer.compose_optimistic(
                snap=snap
            )

            
        if had_query and not had_control:
            return await self.response_composer.compose(
                snap = snap,
                extra_messages= extra_messages,
                instructions=QUERY_INSTRUCTIONS
            )
        
        extra_messages.append({
            "role": "tool",
            "tool_name": "home_assistant_control",
            "content": json.dumps(control_results, ensure_ascii=False, default=str),
        })

        return await self.response_composer.compose(
            snap=snap,
            extra_messages=extra_messages,
            instructions=MIXED_INSTRUCTIONS,
        )