import asyncio
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from pathlib import Path
from apscheduler.triggers.date import DateTrigger
from apscheduler.triggers.cron import CronTrigger

from syris_core.llm.provider import LLMProvider
from syris_core.llm.processors.intent_parser import IntentParser
from syris_core.llm.processors.plan_generator import Planner
from syris_core.llm.processors.response_composer import ResponseComposer
from syris_core.types.events import Event, EventType
from syris_core.types.task import (
    Automation,
    AlarmAutomation,
    PlanAutomation,
    PromptAutomation,
    TimerAutomation,
    TriggerType,
)
from syris_core.automation.service import SchedulingService
from syris_core.types.llm import (
    Intent,
    IntentType,
    Plan,
    PlanExecutionResult,
    ScheduleAction,
    ScheduleSetArgs,
)
from syris_core.types.memory import MemorySnapshot
from syris_core.events.bus import EventBus
from syris_core.memory.working_memory import WorkingMemory
from syris_core.execution.plan_executor import PlanExecutor
from syris_core.tools.registry import TOOL_REGISTRY, TOOL_PROMPT_LIST
from syris_core.util.logger import log
from syris_core.util.helpers import normalize_message_content, resolve_run_at

PROMPTS_DIR = Path(__file__).resolve().parents[1] / "llm" / "prompts"


class Orchestrator:
    def __init__(self):
        # self.tool_registry = tool_registry
        # self.memory_client = memory_client

        # Memory
        self.working_memory = WorkingMemory()

        # LLM Layer
        intent_prompt = open(PROMPTS_DIR / "intent.txt").read()
        plan_prompt = open(PROMPTS_DIR / "planning.txt").read()
        response_prompt = open(PROMPTS_DIR / "system.txt").read()

        provider = LLMProvider(model_name="gpt-oss")
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

        # Execution
        self.plan_executor = PlanExecutor()

        # Scheduling
        self.scheduling_service: SchedulingService | None = None

    # Main loop
    async def start(self):
        log("orchestrator", "Started event loop.")

        while True:
            event = await self._event_queue.get()

            asyncio.create_task(self._handle_event_safe(event))

            self._event_queue.task_done()

    def set_scheduling_service(self, scheduling_service: SchedulingService):
        self.scheduling_service = scheduling_service

    def require_scheduling_service(self) -> SchedulingService:
        if not self.scheduling_service:
            raise RuntimeError("SchedulingService not initialized on Orchestrator")
        return self.scheduling_service

    async def _handle_event_safe(self, event: Event):
        try:
            await self.handle_event(event)
        except Exception as e:
            log("orchestrator", f"Error handling event {event.type}: {e}")

    # Add event to event queue, called by EventBus
    async def dispatch_event(self, event: Event):
        await self._event_queue.put(event)

    # Handle event based on event type
    async def handle_event(self, event: Event):
        log("orchestrator", f"Handling event: {event.type} -> {event.payload}")

        if event.type == EventType.INPUT:
            await self._handle_input(event=event)
        elif event.type == EventType.SCHEDULE:
            await self._handle_automation(event=event)

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

            # generate plan summary with no memory as automated plans should be independant of recent working memory
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
        intent_type = intent.root.type

        if intent_type == IntentType.CHAT:
            return await self._handle_chat(
                intent=intent, user_text=user_text, snap=snap
            )

        elif intent_type == IntentType.TOOL:
            return await self._handle_tool(
                intent=intent, user_text=user_text, snap=snap
            )

        elif intent_type == IntentType.PLAN:
            return await self._handle_plan(
                intent=intent, user_text=user_text, snap=snap
            )

        elif intent_type == IntentType.SCHEDULE:
            return await self._handle_schedule(
                intent=intent, user_text=user_text, snap=snap
            )

        elif intent_type == "control":
            pass

        elif intent_type == "autonmy":
            pass

        else:
            pass

        return "Apologies, that intent type is not set up for routing yet."

    async def _handle_chat(self, intent: Intent, user_text: str, snap: MemorySnapshot):
        return await self.response_composer.compose(snap=snap)

    async def _call_tool(self, tool_name: str, args):
        tool_entry = TOOL_REGISTRY.get(tool_name)

        if not tool_entry:
            return "Tool not found."

        result = tool_entry["func"](**args)
        return result

    async def _handle_tool(self, intent: Intent, user_text, snap: MemorySnapshot):
        intent_obj = intent.root
        assert not intent_obj.type == IntentType.SCHEDULE
        tool_names = (
            intent_obj.subtype
            if isinstance(intent_obj.subtype, list)
            else [intent_obj.subtype]
        )
        args = intent_obj.arguments
        results = {}
        tool_messages: list[dict] = []

        log("orchestrator", f"Handling tools {tool_names} with arguments {args}")

        for tool_name in tool_names:
            if not tool_name:
                continue

            tool_entry = TOOL_REGISTRY.get(tool_name)
            if not tool_entry:
                # return await self.response_composer.compose(status="Error")
                results[tool_name] = "Tool not found."
                continue

            tool_args = args.get(tool_name, {}) if isinstance(args, dict) else args

            # potential refactor to await asyncio.to_thread(func) if tools can block the process
            result = tool_entry["func"](**tool_args)
            results[tool_name] = result

            content = normalize_message_content(result)
            tool_messages.append(
                {"role": "tool", "tool_name": tool_name, "content": content}
            )

        reply = await self.response_composer.compose(
            snap=snap, extra_messages=tool_messages
        )

        # persist tool messages incase later calls need to make use of it
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
        intent_obj = intent.root

        if intent_obj.subtype != ScheduleAction.SET:
            return

        args = intent_obj.arguments
        if not isinstance(args, ScheduleSetArgs):
            raise TypeError(f"Schedule arguments are of incorrect type: {type(args)!r}")

        tz = ZoneInfo("Europe/London")
        now = datetime.now(tz=tz)
        trigger = self._build_trigger(args=args, now=now, tz=tz)
        automation = self._build_automation(args=args, trigger=trigger)
        log("core", f"{automation}")

        scheduler = self.require_scheduling_service()
        await scheduler.add_automation(automation=automation)
        await self._emit_response("Yes sir.")

    def _build_trigger(self, args: ScheduleSetArgs, now: datetime, tz: ZoneInfo):
        # Pick exactly one scheduling mechanism.
        if args.time_expression:
            run_at = resolve_run_at(
                time_expression=args.time_expression, now=now, tz=tz
            )
            return DateTrigger(run_date=run_at)

        if args.cron:
            minute, hour, day, month, day_of_week = args.cron.split()
            return CronTrigger(
                minute=minute,
                hour=hour,
                day=day,
                month=month,
                day_of_week=day_of_week,
            )

        if args.delay_seconds is not None:
            return DateTrigger(run_date=now + timedelta(seconds=args.delay_seconds))

        if args.run_at:
            return DateTrigger(run_date=args.run_at)

        raise ValueError(
            "No scheduling info provided (expected time_expression, cron, delay_seconds, or run_at)."
        )

    def _build_automation(self, args: ScheduleSetArgs, trigger: TriggerType):
        common = dict(
            id=args.id,
            trigger=trigger,
            label=args.label,
        )

        if args.kind == "alarm":
            return AlarmAutomation(mode="alarm", **common)

        if args.kind == "timer":
            return TimerAutomation(mode="timer", **common)

        raise ValueError(f"Unknown automation kind: {args.kind!r}")
