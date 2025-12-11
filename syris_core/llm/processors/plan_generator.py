import json

from syris_core.llm.provider import LLMProvider
from syris_core.types.llm import Intent
from syris_core.util.logger import  log

class Planner:
    def __init__(self, provider: LLMProvider, system_prompt: str):
        self.provider = provider
        self.system_prompt = system_prompt

    async def generate(
            self,
            intent: Intent,
            user_input: str,
    ):
        intent_json = json.dumps(intent.model_dump(), ensure_ascii=False)

        log("llm", f"[Planner] Im planning something")

        response = await self.provider.complete(system_prompt=self.system_prompt)