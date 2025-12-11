import json

from typing import Any
from syris_core.llm.provider import LLMProvider
from syris_core.types.llm import Intent
from syris_core.util.logger import log

class ResponseComposer:
    def __init__(self, provider: LLMProvider, system_prompt: str):
        self.provider = provider
        self.system_prompt = system_prompt

    async def compose(
            self,
            intent: Intent,
            user_input: str,
            result: dict[str, Any] | None = None,
            status: str = "normal",
            instructions: str | None = None
    ):
        intent_json = json.dumps(intent.model_dump(), ensure_ascii=False)
        prompt = (
            f"Intent: {intent_json}\n"
            f"User message: {user_input}\n"
            f"Execution results: {result}\n"
            f"Status: {status}"
        )
        final_prompt = self.system_prompt + instructions if isinstance(instructions, str) else self.system_prompt

        log("llm", f"[ResponseComposer] Generating reply (status={status}) (prompt={prompt})")

        response = await self.provider.complete(system_prompt=final_prompt)
        raw: str = response['message']['content']

        return raw.strip()
    
    # compose optimistic / error / error / tool response ?? / summarize

    async def compose_optimistic(
            self,
            intent: Intent,
            user_input: str,
    ):
        optimistic_prompt = "Produce a short confirmation message acknowledging the request.\nMaximum 7 words. No explanation. Maintain SYRIS tone.\nExamples:\n - “Right away, sir.”\n - “On it, sir.”\n - “Initiating now.”\n - “Working on that.”\n - “As you wish.”\n - “Beginning the process.”\n - “Understood.”\n - “Certainly.”"
        return await self.compose(
            intent=intent, 
            user_input=user_input,
            instructions=optimistic_prompt
        )