from dataclasses import dataclass
from typing import Dict, List

from syris_core.automation.rules.models.rule import Rule

@dataclass
class RuleRegistry:
    rules_by_entity_id: Dict[str, List[Rule]]

    @classmethod
    def build(cls, rules: List[Rule]) -> "RuleRegistry":
        index: Dict[str, List[Rule]] = {}
        for r in rules:
            index.setdefault(r.trigger.entity_id, []).append(r)

        return cls(rules_by_entity_id = index)
    
    def candidates_for_entity(self, entity_id: str) -> List[Rule]:
        return self.rules_by_entity_id.get(entity_id, [])
