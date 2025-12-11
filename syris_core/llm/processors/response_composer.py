import json

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
            result: dict | None = None,
            status: str = "normal",
    ):
        intent_json = json.dumps(intent.model_dump(), ensure_ascii=False)
        prompt = (
            f"Intent: {intent_json}\n"
            f"User message: {user_input}\n"
            f"Execution results: {result}\n"
            f"Status: {status}"
        )

        log("llm", f"[ResponseComposer] Generating reply (status={status}) (prompt={prompt})")

        response = await self.provider.complete(system_prompt=self.system_prompt, prompt=prompt)
        raw: str = response['message']['content']

        return raw.strip()