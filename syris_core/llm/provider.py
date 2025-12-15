from ollama import chat, ChatResponse, AsyncClient

from typing import Any, Dict, Literal

from syris_core.memory.working_memory import WorkingMemory
from syris_core.util.logger import log

class LLMProvider:
    def __init__(self, working_memory: WorkingMemory, model_name: str = "gpt-oss", host="http://localhost:11434"):
        self.model_name = model_name
        self.working_memory = working_memory
        self.client = AsyncClient()

    async def complete(self, system_prompt: str, format: Dict[str, Any] | Literal['', 'json'] | None = None, tools = None, think: Literal["low", "medium", "high"] = "low") -> ChatResponse:
        messages = [
                {"role": "system", "content": system_prompt},
                *self.working_memory.get_context(),
        ]
        log("memory", f"[WorkingMemory] Previous Messages: {[*self.working_memory.get_context()]}")

        return await self.client.chat(model=self.model_name, messages=messages, format=format, think=think)


