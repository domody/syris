import json

from syris_core.llm.provider import LLMProvider
from syris_core.types.llm import Intent, IntentType
from syris_core.tools.registry import TOOL_MANIFEST
from syris_core.util.logger import log

class IntentParser:
    def __init__(self, provider: LLMProvider, system_prompt: str):
        self.provider = provider
        self.system_prompt = system_prompt

    async def parse(self, text: str) -> Intent:
        prompt = (
            f"{text}"
        )

        log("llm", f"[IntentParser] Parsing input (text={text})")

        response = await self.provider.complete(system_prompt=self.system_prompt, format=Intent.model_json_schema())
       
        if response.message.tool_calls:
            tool_calls = response.message.tool_calls

            intent = Intent(
                type = IntentType.TOOL,
                subtype = [tc.function.name for tc in tool_calls],
                confidence= 1.0,
                arguments = {
                    tc.function.name: dict(tc.function.arguments)
                    for tc in tool_calls
                },
            )
            log("llm", f"[IntentParser] Intent classified via ToolExtraction as: {intent}")
            return intent
            
        raw: str = response['message']['content']

        try:
            data = json.loads(raw)
        except Exception:
            log("error", f"[IntentParser] Failed to parse Intent JSON: {raw}")
            return Intent(type=IntentType.UNKNOWN, subtype=None, confidence=0.0, arguments={})

        try:
            intent = Intent(**data)
            log("llm", f"[IntentParser] Intent classified as: {intent}")
            return intent
        except Exception as e:
            log("error", f"[IntentParser] Invalid Intent shape: {data}")
            log("error", str(e))
            return Intent(type=IntentType.UNKNOWN, subtype=None, confidence=0.0, arguments={})

