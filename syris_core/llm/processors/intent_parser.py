import json

from syris_core.llm.provider import LLMProvider
from syris_core.types.llm import Intent, IntentType
from syris_core.util.logger import log

class IntentParser:
    def __init__(self, provider: LLMProvider, system_prompt: str):
        self.provider = provider
        self.system_prompt = system_prompt
        
    async def parse(self, text: str) -> Intent:
        prompt = (
            f"{text}"
        )

        log("llm", f"[IntentParser] Parsing input (text={text}) (prompt={prompt})")

        raw = await self.provider.complete(system_prompt=self.system_prompt, prompt=prompt)
       
        try:
            data = json.loads(raw)
        except Exception:
            log("error", f"[IntentParser] Failed to parse Intent JSON: {raw}")
            return Intent(type=IntentType.UNKNOWN, subtype=None, confidence=0.0, arguments={})

        try:
            return Intent(**data)
        except Exception as e:
            log("error", f"[IntentParser] Invalid Intent shape: {data}")
            log("error", str(e))
            return Intent(type=IntentType.UNKNOWN, subtype=None, confidence=0.0, arguments={})

