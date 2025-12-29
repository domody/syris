import time
from dataclasses import dataclass, field
from typing import Dict, Optional, Any
from pydantic import Field

from syris_core.types.events import Event, EventType
from syris_core.automation.rules.registry import RuleRegistry
from syris_core.automation.rules.models.rule import Rule
from syris_core.home_assistant.executor import ControlExecutor
from syris_core.types.llm import ControlAction
from syris_core.util.logger import log

@dataclass
class RuleEngine:
    registry: RuleRegistry
    control_executor: ControlExecutor

    # _last_run: Dict[str, float] = Field(default_factory=Dict)
    _last_run: Dict[str, float] = field(default_factory=dict)

    def _event_entity_id(self, event: Event) -> Optional[str]:
        return event.payload.get("entity_id")

    def _event_state(self, event: Event) -> Optional[str]:
        return event.payload.get("state")

    def _matches(self, rule: Rule, event: Event) -> bool:
        if event.type != EventType.DEVICE:
            return False
        
        entity_id = self._event_entity_id(event=event)
        if entity_id != rule.trigger.entity_id:
            return False
        
        state = self._event_state(event=event)
        if rule.trigger.require_state and state is None:
            return False
        
        if rule.trigger.to_state is not None and state != rule.trigger.to_state:
            return False
        
        # tbd old state checks; needs to be added the event payload first

        return True
    
    def _cooldown_ok(self, rule: Rule) -> bool:
        cd = rule.policy.cooldown_s
        if not cd:
            return True
        
        last = self._last_run.get(rule.id)
        if last is None:
            return True
        
        return (time.time() - last) >= cd
    
    async def handle_event(self, event: Event) -> None:
        if event.type != EventType.DEVICE:
            return
        
        entity_id = self._event_entity_id(event)
        print(entity_id)
        if not entity_id:
            return

        candidates = self.registry.candidates_for_entity(entity_id)
        print(candidates)
        if not candidates:
            return
        
        for rule in candidates:
            print(rule)
            if not rule.policy.enabled:
                continue

            if not self._matches(rule, event):
                continue

            if not self._cooldown_ok(rule):
                continue

            log("rules", f"Rule matched: {rule.id}")
            self._last_run[rule.id] = time.time()

            for action in rule.actions:
                if isinstance(action, ControlAction):
                    await self.control_executor.execute_action(action)