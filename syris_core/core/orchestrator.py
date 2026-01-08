import asyncio
import time
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
    ToolArgs,
    ControlIntent,
    ControlArgs,
    ControlAction,
    QueryAction,
    ControlDomain,
    ControlOperation,
    TargetSpec,
    NameTarget,
    ChatArgs
)
from syris_core.types.home_assistant import QueryResult, ControlResult
from syris_core.automation.scheduling.service import SchedulingService
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
from syris_core.tracing.context.request_context import TRACE_CTX, TraceContext
from syris_core.tracing.collector.trace_collector import TraceCollector
from syris_core.tracing.snapshot.snapshot_builder import SnapshotBuilder
from ..transport.models.requests import UserRequest

PROMPTS_DIR = Path(__file__).resolve().parents[1] / "llm" / "prompts"


class Orchestrator:
    def __init__(self, control_executor: ControlExecutor, event_bus: EventBus, snapshot_builder: SnapshotBuilder):
        self.config = OrchestratorConfig()

        # Memory
        self.working_memory = WorkingMemory()
        self.snapshot_builder = snapshot_builder
        
        # LLM Layer
        intent_prompt = open(PROMPTS_DIR / self.config.intent_prompt_file).read()
        plan_prompt = open(PROMPTS_DIR / self.config.planning_prompt_file).read()
        response_prompt = open(PROMPTS_DIR / self.config.system_prompt_file).read()

        planner_provider = LLMProvider(model_name=self.config.model_name)
        router_provider  = LLMProvider("qwen2.5:7b")
        # router_provider  = LLMProvider(model_name=self.config.model_name)

        tool_list = TOOL_PROMPT_LIST.strip()

        self.intent_parser = IntentParser(
            provider=router_provider,
            system_prompt=intent_prompt.replace("{TOOL_PROMPT_LIST}", tool_list),
        )
        self.planner = Planner(
            provider=planner_provider,
            system_prompt=plan_prompt.replace("{TOOL_PROMPT_LIST}", tool_list),
        )
        self.response_composer = ResponseComposer(
            provider=planner_provider,
            system_prompt=response_prompt,
            snapshot_builder=self.snapshot_builder
        )

        # Event queue
        self.event_bus = event_bus
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
            event = await self.event_bus.next_event()

            task = asyncio.create_task(self._handle_event_with_limits(event))
            self._tasks.add(task)

            def _done(t: asyncio.Task):
                self._tasks.discard(t)
                try:
                    t.result()
                except Exception as e:
                    log("orchestrator", f"Unhandled task error: {e}")
                finally:
                    self.event_bus.task_done()

            task.add_done_callback(_done)

    async def submit_request(self, req: UserRequest) -> str:
        payload = {}

        if req.text is not None:
            payload = {"text": req.text}
        else:
            payload = {
                "command": {
                    "action": req.action,
                    "entity_id": req.entity_id,
                    "args": req.args,
                }
            }

        event = Event(
            type=EventType.INPUT,
            user_id=req.user_id or "dev",
            source=req.source if req.session_id is None else f"{req.source}:{req.session_id}",
            payload=payload,
            timestamp=time.time(),
        )
        event.request_id = req.request_id
        if req.trace_id:
            event.trace_id = req.trace_id
        
        await self.event_bus.publish(event)
        return req.request_id
    
    async def _handle_event_with_limits(self, event: Event):
        token = TRACE_CTX.set(TraceContext(
            trace_id=event.trace_id,
            request_id=event.request_id,
        ))

        try:
            async with self._sem_events:
                await self._handle_event_safe(event=event)
        finally:
            TRACE_CTX.reset(token)

    async def _handle_event_safe(self, event: Event):
        try:
            await self.handle_event(event)
        except Exception as e:
            log("orchestrator", f"Error handling event {event.type}: {e}")

    # Handle event based on event type
    async def handle_event(self, event: Event):
        log("orchestrator", f"Handling event: {event.type} -> {event}")

        handler = self._event_handlers.get(event.type, self._handle_unknown_event)
        return await handler(event)

    async def _handle_unknown_event(self, event: Event):
        # await self._emit_response(f"Unknown Event")
        pass

    def set_scheduling_service(self, scheduling_service: SchedulingService):
        self.scheduling_service = scheduling_service

    def require_scheduling_service(self) -> SchedulingService:
        if not self.scheduling_service:
            raise RuntimeError("SchedulingService not initialized on Orchestrator")
        return self.scheduling_service

    # Emit response
    async def _emit_response(self, text: str):
        log("core", f"{text}")
        await self.event_bus.publish(Event(
            type=EventType.ASSISTANT,
            source="orchestrator",
            payload={
                "text": text
            },
            timestamp=time.time()
        ))

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
        #                 ControlAction(
        #                     kind="ha.call_service",
        #                     domain=ControlDomain.LIGHT,
        #                     operation=ControlOperation.POWER_OFF,
        #                     target=NameTarget(
        #                         scope="name",
        #                         selector="many",
        #                         area=None,
        #                         name="ceiling lights",
        #                         entity_ids=[],
        #                     ),
        #                     data={},
        #                     requires_confirmation=False,
        #                 )
        #                 # QueryAction(
        #                 #     kind="ha.state_query",
        #                 #     domain=ControlDomain.LIGHT,
        #                 #     target=TargetSpec(
        #                 #         scope="home",
        #                 #         selector="all",
        #                 #         area=None,
        #                 #         name=None,
        #                 #         entity_ids=[],
        #                 #     ),
        #                 # )
        #             ]
        #         ),
        #     )
        # )

        reply = await self._route_intent(event=event, intent=intent, user_text=user_text, snap=snap)

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
                snap=None, result=result,
                intent=Intent(ChatIntent(
                    type=IntentType.CHAT,
                    subtype=None,
                    confidence=0.8,
                    arguments=ChatArgs(
                        text="Generate a plan summary"
                    )
                )),
                request_id=event.request_id or event.event_id or ""
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
        self, event: Event, intent: Intent, user_text: str, snap: MemorySnapshot
    ) -> str | None:
        handler = self._intent_handlers.get(
            intent.root.type, self._handle_unknown_intent
        )
        return await handler(event, intent, user_text, snap)

    def _handle_unknown_intent(self):
        return "Apologies, that intent type is not set up for routing yet."

    async def _handle_chat(self, event: Event, intent: Intent, user_text: str, snap: MemorySnapshot):
        if event.request_id:
            return await self.response_composer.compose(snap=snap, intent=intent, request_id=event.request_id)

    async def _handle_tool(self, event: Event, intent: Intent, user_text, snap: MemorySnapshot):
        intent_obj = assert_intent_type(intent=intent, expected_type=ToolIntent)

        tool_names = intent_obj.subtype

        log(
            "orchestrator",
            f"Handling tools {tool_names} with arguments {intent_obj.arguments}",
        )

        _, tool_messages = await self.tool_runner.run_tools(
            tool_names=tool_names, args=intent_obj.arguments
        )
        
        await self.event_bus.publish(Event(
            type=EventType.TOOL,
            source="orchestrator",
            payload={
                "tool_name": "test"
            },
            timestamp=time.time()
        ))

        reply = await self.response_composer.compose(
            snap=snap, extra_messages=tool_messages, intent=intent, request_id=event.request_id or ""
        )

        # persist tool messages
        for m in tool_messages:
            self.working_memory.add(
                role=m["role"], content=m["content"], tool_name=m.get("tool_name")
            )

        return reply

    async def _handle_plan(self, event: Event, intent: Intent, user_text, snap: MemorySnapshot):
        optimistic = await self.response_composer.compose_optimistic(snap=snap, intent=intent, request_id=event.request_id or "")
        await self._emit_response(optimistic)

        asyncio.create_task(
            self._execute_plan_async(event=event, intent=intent, user_text=user_text, snap=snap)
        )
        return None

    async def _execute_plan_async(
        self, event: Event, intent: Intent, user_text: str, snap: MemorySnapshot
    ):
        plan = await self.planner.generate()

        result: PlanExecutionResult = await self.plan_executor.execute(
            user_text=user_text, plan=plan
        )

        assert not result.status == "in_progress"

        response = await self.response_composer.compose_plan_summary(
            result=result, snap=snap, intent=intent, request_id=event.request_id or ""
        )

        self.working_memory.add(role="assistant", content=response)
        await self._emit_response(response)

    async def _handle_schedule(
        self, event: Event, intent: Intent, user_text: str, snap: MemorySnapshot
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

        log("core", f"[AUTOMATION] {automation}")

        scheduler = self.require_scheduling_service()
        await scheduler.add_automation(automation=automation)
        self.working_memory.add(
            role="tool",
            tool_name="schedule_event",
            content="success"
        )

        return "Yes sir."

    async def _handle_control(
        self, event: Event, intent: Intent, user_text: str, snap: MemorySnapshot
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
            data = await self.control_executor.execute_action(user_text=user_text, action=action)

            if isinstance(action, QueryAction):
                had_query = True
                assert isinstance(data, QueryResult)
                extra_messages.append(
                    {
                        "role": "tool",
                        "tool_name": "home_assistant_query",
                        "content": data.model_dump_json(),
                    }
                )
                self.working_memory.add(
                    role="tool",
                    tool_name="home_assistant_query",
                    content=data.model_dump_json(),
                )

            elif isinstance(action, ControlAction):
                had_control = True
                assert isinstance(data, ControlResult)
                control_results.append(data)
                extra_messages.append(
                    {
                        "role": "tool",
                        "tool_name": "home_assistant_control",
                        "content": data.model_dump_json(),
                    }
                )
                self.working_memory.add(
                    role="tool",
                    tool_name="home_assistant_control",
                    content=data.model_dump_json(),
                )

        if had_control and not had_query:
            return await self.response_composer.compose(
                snap=snap, extra_messages=extra_messages, intent=intent, request_id=event.request_id or ""
            )

        if had_query and not had_control:
            return await self.response_composer.compose(
                snap=snap,
                extra_messages=extra_messages,
                instructions=QUERY_INSTRUCTIONS, intent=intent, request_id=event.request_id or ""
            )

        return await self.response_composer.compose(
            snap=snap,
            extra_messages=extra_messages,
            instructions=MIXED_INSTRUCTIONS, intent=intent, request_id=event.request_id or ""
        )
