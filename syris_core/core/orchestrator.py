import asyncio 
from pathlib import Path

from syris_core.llm.provider import LLMProvider
from syris_core.llm.processors.intent_parser import IntentParser
from syris_core.llm.processors.response_composer import ResponseComposer
from syris_core.core.dispatcher import Dispatcher
from syris_core.types.events import Event, EventType
from syris_core.events.bus import EventBus
from syris_core.util.logger import log

PROMPTS_DIR = Path(__file__).resolve().parents[1] / "llm" / "prompts"

class Orchestrator:
    def __init__(self):
        # self.tool_registry = tool_registry
        # self.memory_client = memory_client

        # LLM Layer
        intent_prompt = open(PROMPTS_DIR / "intent.txt").read()
        response_prompt = open(PROMPTS_DIR / "system.txt").read()

        provider = LLMProvider(model_name="gpt-oss")
        intent_parser = IntentParser(provider=provider, system_prompt=intent_prompt)
        response_composer = ResponseComposer(provider=provider, system_prompt=response_prompt)

        self.dispatcher = Dispatcher(
            intent_parser=intent_parser,
            response_composer=response_composer
        )

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
            # print("Hello sir.")
            await self._handle_input(event=event)
    
    # Emit response
    async def _emit_response(self, text: str):
        log("core", f"{text}")

    # Handle input events
    async def _handle_input(self, event: Event):
        reply = await self.dispatcher.process_input(event)
        await self._emit_response(reply)