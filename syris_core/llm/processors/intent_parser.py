import json
import datetime
from zoneinfo import ZoneInfo

from syris_core.llm.provider import LLMProvider
from syris_core.types.llm import Intent, IntentType, BaseIntent, ToolIntent, ToolArgs, LLMCallOptions
from syris_core.types.memory import MemorySnapshot
from syris_core.tools.registry import TOOL_MANIFEST
from syris_core.util.logger import log, log_lora_data


class IntentParser:
    def __init__(self, provider: LLMProvider, system_prompt: str):
        self.provider = provider
        self.system_prompt = system_prompt

    async def parse(self, text: str, snap: MemorySnapshot) -> Intent:
        log("llm", f"[IntentParser] Parsing input (text={text})")

        tz = ZoneInfo("Europe/London")
        additional_instructions = f"Current local time is {datetime.datetime.now(tz=tz)}. Use this as the reference for relative times like tomorrow/next week/in 20 minutes."

        response = await self.provider.complete(
            LLMCallOptions(
                system_prompt=self.system_prompt,
                memory=snap.messages,
                format=Intent.model_json_schema(),
                instructions=additional_instructions,
            )
        )

        if response.message.tool_calls:
            tool_calls = response.message.tool_calls

            intent = Intent(
                ToolIntent(
                    type=IntentType.TOOL,
                    subtype=[tc.function.name for tc in tool_calls],
                    confidence=1.0,
                    arguments=ToolArgs(
                        arguments={
                            tc.function.name: dict(tc.function.arguments)
                            for tc in tool_calls
                        }
                    )
                )
            )
        raw: str = response["message"]["content"]
        
        try:
            data = json.loads(raw)

            lora_data = [
                {"role":"user","content":text},
                {"role":"assistant","content":data}
            ]
            log_lora_data(message=f"{lora_data}")
        except Exception:
            log("error", f"[IntentParser] Failed to parse Intent JSON: {raw}")
            return Intent(
                BaseIntent(
                    type=IntentType.UNKNOWN, subtype=None, confidence=0.0, arguments={}
                )
            )

        try:
            intent = Intent(**data)
            log("llm", f"[IntentParser] Intent classified as: {intent}")
            return intent
        except Exception as e:
            log("error", f"[IntentParser] Invalid Intent shape: {data}")
            log("error", str(e))
            return Intent(
                BaseIntent(
                    type=IntentType.UNKNOWN, subtype=None, confidence=0.0, arguments={}
                )
            )
