import asyncio 
import json
from pathlib import Path

from syris_core.llm.provider import LLMProvider
from syris_core.llm.processors.intent_parser import IntentParser
from syris_core.llm.processors.response_composer import ResponseComposer
from syris_core.types.events import Event, EventType
from syris_core.types.llm import Intent, IntentType
from syris_core.events.bus import EventBus
from syris_core.memory.working_memory import WorkingMemory
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
        response_prompt = open(PROMPTS_DIR / "system.txt").read()

        provider = LLMProvider(working_memory=self.working_memory, model_name="gpt-oss")
        self.intent_parser = IntentParser(provider=provider, system_prompt=intent_prompt.replace("{TOOL_PROMPT_LIST}", TOOL_PROMPT_LIST.strip()))
        self.response_composer = ResponseComposer(provider=provider, system_prompt=response_prompt)

        # Event queue
        self._event_queue = asyncio.Queue()
        self.event_bus = EventBus(self.dispatch_event)

    # Main loop
    async def start(self):
        log("orchestrator", "Started event loop.")

        while True:
            event = await self._event_queue.get()

            log("orchestrator", f"Event dequeud -> {event.type}")
            await self.handle_event(event)
            self._event_queue.task_done()

    # Add event to event queue, called by EventBus
    async def dispatch_event(self, event: Event):
        await self._event_queue.put(event)
    
    # Handle event based on event type
    async def handle_event(self, event: Event):
        log("orchestrator", f"Handling event: {event.type} -> {event.payload}")

        if event.type == EventType.INPUT:
            await self._handle_input(event=event)
    
    # Emit response
    async def _emit_response(self, text: str):
        log("core", f"{text}")

    # Handle input events
    async def _handle_input(self, event: Event):
        user_text = event.payload["text"]
        self.working_memory.add(role="user", content=user_text)

        intent = await self.intent_parser.parse(user_text)

        reply = await self._route_intent(intent=intent, user_text=user_text)

        self.working_memory.add(role="assistant", content=reply)

        await self._emit_response(reply)
    
    # Route to correct handler based on intent type
    async def _route_intent(self, intent: Intent, user_text: str) -> str:
        intent_type = intent.type

        if intent_type == IntentType.CHAT:
            return await self._handle_chat(intent=intent, user_text=user_text)

        elif intent_type == IntentType.PLAN:
            return await self._handle_plan(intent=intent, user_text=user_text)

        elif intent_type == IntentType.TOOL:
            return await self._handle_tool(intent=intent, user_text=user_text)

        elif intent_type == "control":
            pass

        elif intent_type == "schedule":
            pass

        elif intent_type == "autonmy":
            pass

        else: 
            pass

        return "Apologies, that intent type is not set up for routing yet."

    async def _handle_chat(self, intent: Intent, user_text: str):
        return await self.response_composer.compose(
            intent=intent,
            user_input=user_text
        )
    
    async def _handle_tool(self, intent: Intent, user_text):
        tool_names = intent.subtype if isinstance(intent.subtype, list) else [intent.subtype]

        args = intent.arguments
        log("orchestrator", f"Handling tools {tool_names} with arguments {args}")

        results = {}

        for tool_name in tool_names:
            if not tool_name:
                continue

            tool_entry = TOOL_REGISTRY.get(tool_name)

            if not tool_entry:
                # return await self.response_composer.compose(status="Error")
                results[tool_name] = "Tool not found."
                continue

            tool_args = args.get(tool_name, {}) if isinstance(args, dict) else args

            result = tool_entry["func"](**tool_args)
            results[tool_name] = result

            content = normalize_message_content(result)
            self.working_memory.add(role="tool", tool_name=tool_name, content=content)
        
        try:
            return await self.response_composer.compose(
                intent=intent,
                user_input=user_text,
                result=results
            )
        except Exception as e:
            return f"Error: {e}"
        
    async def _handle_plan(self, intent: Intent, user_text):
        return await self.response_composer.compose_optimistic(
            intent=intent,
            user_input=user_text
        )