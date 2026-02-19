from ollama import chat, ChatResponse, AsyncClient

from typing import Any, Dict, Literal

from syris_core.types.llm import LLMCallOptions
from syris_core.memory.working_memory import WorkingMemory
from syris_core.util.logger import log


class LLMProvider:
    def __init__(self, model_name: str = "gpt-oss"):
        self.model_name = model_name
        self.client = AsyncClient(host="http://127.0.0.1:11434")

    async def complete(self, call: LLMCallOptions) -> ChatResponse:
        messages = [{"role": "system", "content": call.system_prompt}]

        if call.instructions:
            messages.extend([{"role": "system", "content": call.instructions}])

        if call.memory:
            messages.extend(call.memory)
            log("memory", f"[WorkingMemory] Previous Messages: {call.memory}")

        response = await self.client.chat(
            model=self.model_name,
            messages=messages,
            tools=call.tools,
            format=call.format,
            think=call.think,
            options=call.options,
            keep_alive="10m",
        )

        log("llm", f"[Provider] Thinking: {response.message.thinking}")

        return response
