import asyncio 
import json
from pathlib import Path

from syris_core.llm.provider import LLMProvider
from syris_core.llm.processors.intent_parser import IntentParser
from syris_core.llm.processors.plan_generator import Planner
from syris_core.llm.processors.response_composer import ResponseComposer
from syris_core.types.events import Event, EventType
from syris_core.types.task import Automation
from syris_core.types.llm import Intent, IntentType, Plan, PlanExecutionResult
from syris_core.types.memory import MemorySnapshot
from syris_core.events.bus import EventBus
from syris_core.memory.working_memory import WorkingMemory
from syris_core.execution.plan_executor import PlanExecutor
from syris_core.tools.registry import TOOL_REGISTRY, TOOL_PROMPT_LIST
from syris_core.util.logger import log
from syris_core.util.helpers import normalize_message_content

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
        self.intent_parser = IntentParser(provider=provider, system_prompt=intent_prompt.replace("{TOOL_PROMPT_LIST}", TOOL_PROMPT_LIST.strip()))
        self.planner = Planner(provider=provider, system_prompt=plan_prompt.replace("{TOOL_PROMPT_LIST}", TOOL_PROMPT_LIST.strip()))
        self.response_composer = ResponseComposer(provider=provider, system_prompt=response_prompt)

        # Event queue
        self._event_queue = asyncio.Queue()
        self.event_bus = EventBus(self.dispatch_event)

        # Execution
        self.plan_executor = PlanExecutor()

    # Main loop
    async def start(self):
        log("orchestrator", "Started event loop.")

        while True:
            event = await self._event_queue.get()

            asyncio.create_task(
                self._handle_event_safe(event)
            )

            self._event_queue.task_done()


    async def _handle_event_safe(self, event:Event):
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
            automation: Automation = event.payload["automation"]
            if automation.mode == "plan":
                plan: Plan = automation.plan
                result:PlanExecutionResult = await self.plan_executor.execute(user_text="No user text available; Plan generated from automation.", plan=plan)
        
                assert not result.status == "in_progress"

                # generate plan summary with no memory as automated plans should be independant of recent working memory
                response = await self.response_composer.compose_plan_summary(
                    snap = None,
                    result = result
                )

                self.working_memory.add(role="assistant", scope = "automation", content=response)
                await self._emit_response(response)

            elif automation.mode == "prompt":
                await self._handle_input(Event(
                    type=EventType.SCHEDULE,
                    user_id=event.user_id,
                    source=event.source,
                    payload={"text": automation.text},
                    timestamp=event.timestamp
                ))

            elif automation.mode == "timer":
                log("core", "Your timer is done.")

            elif automation.mode == "alarm":
                log("core", "Your alarm has been triggered.")

    # Emit response
    async def _emit_response(self, text: str):
        log("core", f"{text}")
    
    # Handle input events
    async def _handle_input(self, event: Event):
        user_text = event.payload["text"]

        # add user text to memory first
        self.working_memory.add(role="user", content=user_text)

        snap = self.working_memory.snapshot(scopes = ["chat"])

        intent = await self.intent_parser.parse(user_text, snap)

        reply = await self._route_intent(
            intent = intent,
            user_text = user_text,
            snap = snap
        )

        if reply is not None:
            self.working_memory.add(role="assistant", content=reply)
            await self._emit_response(reply)
    
    # Route to correct handler based on intent type
    async def _route_intent(self, intent: Intent, user_text: str, snap: MemorySnapshot) -> str | None:
        intent_type = intent.type

        if intent_type == IntentType.CHAT:
            return await self._handle_chat(intent=intent, user_text=user_text, snap=snap)

        elif intent_type == IntentType.TOOL:
            return await self._handle_tool(intent=intent, user_text=user_text, snap=snap)

        elif intent_type == IntentType.PLAN:
            return await self._handle_plan(intent=intent, user_text=user_text, snap=snap)

        elif intent_type == "control":
            pass

        elif intent_type == "schedule":
            pass

        elif intent_type == "autonmy":
            pass

        else: 
            pass

        return "Apologies, that intent type is not set up for routing yet."

    async def _handle_chat(self, intent: Intent, user_text: str, snap: MemorySnapshot):
        return await self.response_composer.compose(
            snap = snap
        )
    
    async def _call_tool(self, tool_name: str, args):
        tool_entry = TOOL_REGISTRY.get(tool_name)

        if not tool_entry:
            return "Tool not found."

        result = tool_entry["func"](**args)
        return result
    
    async def _handle_tool(self, intent: Intent, user_text, snap: MemorySnapshot):
        tool_names = intent.subtype if isinstance(intent.subtype, list) else [intent.subtype]
        args = intent.arguments
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
            tool_messages.append({"role": "tool", "tool_name": tool_name, "content": content})

        reply =  await self.response_composer.compose(
            snap = snap,
            extra_messages = tool_messages
        )
        
        # persist tool messages incase later calls need to make use of it
        for m in tool_messages:
            self.working_memory.add(role=m["role"], content=m["content"], tool_name=m.get("tool_name"))

        return reply

    async def _handle_plan(self, intent: Intent, user_text, snap: MemorySnapshot):
        optimistic = await self.response_composer.compose_optimistic(
            snap = snap
        )
        await self._emit_response(optimistic)

        asyncio.create_task(self._execute_plan_async(
            intent = intent, 
            user_text = user_text,
            snap = snap
        ))
        return None
    
    async def _execute_plan_async(self, intent: Intent, user_text: str, snap: MemorySnapshot):
        plan = await self.planner.generate()

        result:PlanExecutionResult = await self.plan_executor.execute(user_text=user_text, plan=plan)
        
        assert not result.status == "in_progress"

        response = await self.response_composer.compose_plan_summary(
            result = result,
            snap = snap
        )

        self.working_memory.add(role="assistant", content=response)
        await self._emit_response(response)

    