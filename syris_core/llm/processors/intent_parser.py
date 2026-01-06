import json
import datetime
from zoneinfo import ZoneInfo
from typing import Literal, Annotated, Optional
from pydantic import BaseModel, Field, confloat

from syris_core.llm.provider import LLMProvider
from syris_core.types.llm import (
    Intent,
    IntentType,
    BaseIntent,
    ToolIntent,
    ToolArgs,
    LLMCallOptions,
)
from syris_core.types.memory import MemorySnapshot
from syris_core.tools.registry import TOOL_MANIFEST, TOOL_PROMPT_LIST
from syris_core.util.logger import log, log_lora_data

from ..intent.lane_router import score_lane, build_lane_router_schema, build_lane_router_prompt
from ..intent.subaction_router import score_subactions, build_subaction_router_schema, build_subaction_router_prompt
# print(TOOL_PROMPT_LIST)


class IntentParser:
    def __init__(self, provider: LLMProvider, system_prompt: str):
        self.provider = provider
        self.system_prompt = system_prompt

    async def parse(self, text: str, snap: MemorySnapshot) -> Intent:
        log("llm", f"[IntentParser] Parsing input (text={text})")

        # tz = ZoneInfo("Europe/London")
        # additional_instructions = f"Current local time is {datetime.datetime.now(tz=tz)}. Use this as the reference for relative times like tomorrow/next week/in 20 minutes."
        lane = await self.route_lane(text, snap)
        if not lane:
            return
            
        subaction = await self.route_subaction(text=text, lane_id=lane, snap=snap)

        return 
    
        response = await self.provider.complete(
            LLMCallOptions(
                system_prompt=self.system_prompt,
                memory=snap.messages,
                format=Intent.model_json_schema(),
                # instructions=additional_instructions,
                think=None,
                options={
                    "temperature": 0
                },
                tools=TOOL_MANIFEST
            )
        )

        if response.message.tool_calls:
            log("llm", "[IntentParser] Tool call flagged.")
            tool_calls = response.message.tool_calls

            intent = Intent(
                ToolIntent(
                    type=IntentType.TOOL,
                    subtype=[tc.function.name for tc in tool_calls],
                    confidence=0.95,
                    arguments=ToolArgs(
                        arguments={
                            tc.function.name: dict(tc.function.arguments)
                            for tc in tool_calls
                        }
                    ),
                )
            )
            return intent
        
        raw: str = response["message"]["content"]

        try:
            data = json.loads(raw)

            lora_data = [
                {"role": "user", "content": text},
                {"role": "assistant", "content": data},
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


    async def route_lane(self, text: str, snap: MemorySnapshot):
        lane_scores = score_lane(text=text)
        top_lanes: list[str] = lane_scores["top_lanes"]
        scores: dict[str, float] = lane_scores["scores"]
        
        EPS = 1e-9

        chat_score = scores.get("chat", 0.0)

        if (
            chat_score > EPS
            and all(abs(score) < EPS for lane, score in scores.items() if lane != "chat")
        ):
            log("llm", "[IntentParser] Auto-routing lane chat as only available option")
            return "chat"

        non_chat = [lane for lane in top_lanes if lane != "chat"]
        diff = scores[non_chat[0]] - scores[non_chat[1]]

        if diff >= 1.5:
            log("llm", f"[IntentParser] Auto-routing lane {top_lanes[0]} due to score diff")
            return top_lanes[0]
    
        schema = build_lane_router_schema(candidates=top_lanes, include_chat_fallback=True)
        prompt = build_lane_router_prompt(candidates=top_lanes)

        response = await self.provider.complete(LLMCallOptions(
                system_prompt=prompt,
                tools=None,
                memory=snap.messages,
                format=schema,
                think=None,
                options={
                    "temperature": 0,
                    "num_predict": 64
                },
            )
        )
        raw = response.message.content
        if not raw:
            return

        data = json.loads(raw)
        route = data["route"]

        log("llm", f"[IntentParser] Route determined as {route}")
        return route

    async def route_subaction(self, text: str, lane_id: str, snap: MemorySnapshot) -> Optional[str]:
        subaction_scores = score_subactions(text=text, lane_id=lane_id)
        top_subactions: list[str] = subaction_scores["top_subactions"]
        scores: dict[str, float] = subaction_scores["scores"]
        print(scores)
        print(top_subactions)
        if len(top_subactions) >= 2:
            diff = scores[top_subactions[0]] - scores[top_subactions[1]]
            if diff > 1.5:
                log("llm", f"[IntentParser] Auto-routing subaction {top_subactions[0]} due to score diff")
                return top_subactions[0]
            
        schema = build_subaction_router_schema(candidates=top_subactions)
        prompt = build_subaction_router_prompt(candidates=top_subactions, lane_id=lane_id)

        if not prompt:
            return None
        
        response = await self.provider.complete(LLMCallOptions(
                system_prompt=prompt,
                tools=None,
                memory=snap.messages,
                format=schema,
                think=None,
                options={
                    "temperature": 0,
                    "num_predict": 64
                },
            )
        )

        raw = response.message.content
        if not raw:
            return None

        data = json.loads(raw)
        subaction = data["subaction"]

        log("llm", f"[IntentParser] Subaction determined as {subaction}")
        return subaction