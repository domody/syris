import yaml
from dataclasses import dataclass, field
from pydantic import BaseModel, ValidationError
from typing import Optional, Dict, Any, List, Mapping
from pathlib import Path
from enum import Enum

from syris_core.types.events import Event, EventType
from syris_core.types.llm import Intent, IntentType, ScheduleIntent, ControlAction, ToolIntent, ChatIntent, BaseIntent, ControlArgs, ControlDomain, QueryAction, ControlIntent, ControlOperation, TargetSpec, ScheduleSetArgs, ScheduleAction
from syris_core.util.helpers import assert_intent_type

class ToolInfo(BaseModel):
    capability_id: str
    options: Dict[str, Any]

class CapabilityTool(BaseModel):
    kind: str
    options: Optional[Dict[str, Any]] = None

class Capability(BaseModel):
    id: str
    description: str
    intent_types: list[str]
    confirmable: bool
    default_confirm_wait_ms: Optional[float] = None
    attributes: Optional[Dict[str, Any]] = None
    tools: Optional[List[CapabilityTool]] = None
    policy: Optional[Dict[str, Any]] = None

class CapabilityMatch(BaseModel):
    capability_id: str
    score: int
    reasons: list[str]

@dataclass
class CapabilityRegistry:
    _caps: Dict[str, Capability] = field(default_factory=dict)
    
    # tool id -> matching capabilitiy id(s)
    _tools: Dict[str, List[ToolInfo]] = field(default_factory=dict)

    def build(self) -> None:
        with open(Path(__file__).parent / "definitions.yaml", "r") as f:
            try:
                caps = yaml.safe_load(f)
                for _cap in caps:
                    try:
                        cap = Capability(**_cap)
                    except ValidationError as e:
                        print(e)
                    if not cap.id:
                        continue
                    self._caps[cap.id] = cap
                    self._map_cap_to_tools(capability=cap)

            except yaml.YAMLError as e:
                print(Exception)
        

    def _map_cap_to_tools(self, capability: Capability):
        cap_id = capability.id
        tools = capability.tools
        if not tools:
            return
        
        for tool in tools:
            entry = self._tools.setdefault(tool.kind, [])
            entry.append(ToolInfo(
                capability_id=cap_id,
                options=tool.options if tool.options else {}
            ))

    def identify_capability(self, tool_event: Event) -> Optional[str]:
        if tool_event.type != EventType.TOOL:
            return None
        
        payload = tool_event.payload
        tool_kind = payload.get("kind")
        if not tool_kind:
            return None
        

        candidates = self._tools.get(tool_kind, [])
        candidates = sorted(candidates, key=lambda c: len(c.options), reverse=True)

        for candidate in candidates:
            missing_or_mismatch = []
            for k, v in candidate.options.items():
                if payload.get(k) != v:
                    missing_or_mismatch.append((k, v, payload.get(k)))

            if not missing_or_mismatch:
                print("MATCH:", candidate.capability_id)
                return candidate.capability_id

            print("NOPE:", candidate.capability_id, "because", missing_or_mismatch)

        return None

    def capability_available(self, capability_id: str) -> Optional[str]:
        pass

    def relevant_capabilities(self, intent: Intent) -> Optional[List[CapabilityMatch]]:
        # scoring rules:
        # intent type matches + 80 
        # each action that matches capability kind + 30
        intent_type = None
        attributes: dict[str, Any] = {}
        actions: list[str] = []

        matches: list[CapabilityMatch] = []

        match intent.root.type:
            case IntentType.CONTROL:
                root = assert_intent_type(intent=intent, expected_type=ControlIntent)
                intent_type = "control"
                for action in root.arguments.actions:
                    actions.append(action.kind)
                    attributes.setdefault("entity_domains", []).append(action.domain.value)

            case IntentType.SCHEDULE:
                root = assert_intent_type(intent=intent, expected_type=ScheduleIntent)
                intent_type = "schedule"
                for key, value in root.arguments:
                    if key == "subtype":
                        assert isinstance(value, ScheduleAction), f"bug"
                        actions.append(value.value)
                    elif key == "kind":
                        attributes["schedule_kinds"] = value

        for id, cap in self._caps.items():
            score = 0
            reasons: list[str] = []

            if intent_type in cap.intent_types:
                score += 80
                reasons.append(f"intent type: {intent_type}")
            
            if cap.attributes:

                for k, a_val in attributes.items():
                    if self._attribute_is_match(a_val=a_val, b_val=cap.attributes.get(k)):
                        score += 15
                        reasons.append(f"attribute: {{{k}:{a_val}}} ")
                        
            if cap.tools:
                for tool in cap.tools:
                    if tool.kind in actions:
                        score += 15 
                        reasons.append(f"action: {tool.kind}")
            if score > 0:
                matches.append(CapabilityMatch(capability_id=id, score=score, reasons=reasons))  
        matches.sort(key=lambda m: m.score, reverse=True)

        return [m for m in matches if m.score >= 70]

    def _attribute_is_match(self, a_val, b_val) -> bool:
        if b_val is None:
            return False
        
        if isinstance(a_val, Mapping) and isinstance(b_val, Mapping):
            return all(self._attribute_is_match(av, b_val.get(ak)) for ak, av in a_val.items())

        is_seq = lambda x: isinstance(x, (list, tuple, set, frozenset))
        if is_seq(a_val) and is_seq(b_val):
            return set(a_val).issubset(set(b_val))

        return a_val == b_val
    
    def policy_for(self, capability_id: str) -> Optional[dict]:
        cap = self._caps.get(capability_id)
        if not cap:
            return None
        
        return cap.policy