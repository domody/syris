import json
import datetime
import uuid
from zoneinfo import ZoneInfo
from typing import Literal, Annotated, Optional, Any
from pydantic import BaseModel, Field, confloat

from syris_core.llm.provider import LLMProvider
from syris_core.types.llm import (
    Intent,
    IntentType,
    BaseIntent,
    ChatIntent,
    ChatArgs,
    ToolIntent,
    ToolArgs,
    ControlIntent,
    ControlArgs,
    ControlAction,
    QueryAction,
    ScheduleIntent,
    ScheduleSetArgs,
    ScheduleAction,
    LLMCallOptions,
)
from syris_core.types.memory import MemorySnapshot
from syris_core.tools.registry import TOOL_MANIFEST, TOOL_PROMPT_LIST
from syris_core.util.logger import log, log_lora_data

from ..intent.lane_router import score_lane, build_lane_router_schema, build_lane_router_prompt
from ..intent.subaction_router import score_subactions, build_subaction_router_schema, build_subaction_router_prompt
from ..intent.registry import LANE_REGISTRY
from ..intent.schema_resolver import resolve_schema, resolve_schema_json
from ..intent.argument_filler import build_argument_filler_prompt
from ..intent.build_intent import build_intent_from_subaction
from ..models.intent import Lane, Subaction


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
            return Intent(
                BaseIntent(
                    type=IntentType.UNKNOWN, subtype=None, confidence=0.0, arguments={}
                )
            )
            
        if lane == "chat":
            return Intent(
                ChatIntent(
                    type=IntentType.CHAT,
                    subtype=None,
                    confidence=0.25,
                    arguments=ChatArgs(text=text),
                )
            )

        subaction_id = await self.route_subaction(text=text, lane_id=lane, snap=snap)
        if not subaction_id:
            return Intent(
                BaseIntent(
                    type=IntentType.UNKNOWN, subtype=None, confidence=0.0, arguments={}
                )
            )

        lane_entry = LANE_REGISTRY.get(lane)
        if not lane_entry or not lane_entry.subactions:
            return Intent(
                BaseIntent(
                    type=IntentType.UNKNOWN, subtype=None, confidence=0.0, arguments={}
                )
            )

        subaction = lane_entry.subactions.get(subaction_id)
        if not subaction:
            return Intent(
                BaseIntent(
                    type=IntentType.UNKNOWN, subtype=None, confidence=0.0, arguments={}
                )
            )

        args_schema = resolve_schema(subaction.schema_id)
        if not args_schema:
            return Intent(
                BaseIntent(
                    type=IntentType.UNKNOWN, subtype=None, confidence=0.0, arguments={}
                )
            )  
        
        raw_args = await self.fill_subaction_args(
            subaction=subaction,
            snap=snap,
            schema=args_schema.model_json_schema(),
        )

        if raw_args is None:
            return Intent(
                BaseIntent(
                    type=IntentType.UNKNOWN, subtype=None, confidence=0.0, arguments={}
                )
            )


        try:
            parsed_args = args_schema.model_validate(raw_args)
        except Exception as e:
            log("error", f"[IntentParser] Invalid args for schema {args_schema}: {e}")
            return Intent(
                BaseIntent(
                    type=IntentType.UNKNOWN, subtype=None, confidence=0.0, arguments={}
                )
            )

        intent = build_intent_from_subaction(
            lane_id=lane,
            subaction_id=subaction_id,
            args=parsed_args,
        )
        if intent:
            return intent

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
        log("llm", f"[IntentParser] Tokens: {response.eval_count}")
        log("llm", f"[IntentParser] Output: {response.message.content}")
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

    async def fill_subaction_args(
        self,
        subaction: Subaction,
        schema: dict[str, Any],
        snap: MemorySnapshot,
    ) -> Optional[dict]:
        prompt = build_argument_filler_prompt(subaction=subaction, schema=schema)
        response = await self.provider.complete(
            LLMCallOptions(
                system_prompt=prompt,
                tools=None,
                memory=snap.messages,
                format=schema,
                think=None,
                options={
                    "temperature": 0,
                    "num_predict": 192,
                },
            )
        )
        raw = response.message.content
        log("llm", f"[IntentParser] Tokens: {response.eval_count}")
        log("llm", f"[IntentParser] Output: {response.message.content}")

        if not raw:
            return None
        try:
            return json.loads(raw)

        except Exception as e:
            log("error", f"[IntentParser] Failed to parse subaction args JSON: {e}")
            return None
