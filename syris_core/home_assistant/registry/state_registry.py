from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional

from syris_core.types.home_assistant import EntityState
from syris_core.home_assistant.interface import HomeAssistantInterface


@dataclass
class StateRegistry:
    _states: Dict[str, EntityState]
    ready: bool = False
    
    @classmethod
    def empty(cls)-> "StateRegistry":
        return cls(_states={})

    async def refresh(self, ha: HomeAssistantInterface) -> None:
        raw = await ha.list_entities()
        states = {}
        for item in raw:
            e = (
                item
                if isinstance(item, EntityState)
                else EntityState.model_validate(item)
            )
            states[e.entity_id] = e
        self._states = states
        self.ready = True

    def get(self, entity_id: str) -> Optional[EntityState]:
        return self._states.get(entity_id)

    def all(self) -> List[EntityState]:
        return list(self._states.values())

    def upsert(self, state: EntityState) -> None:
        self._states[state.entity_id] = state

    def remove(self, entity_id: str) -> None:
        self._states.pop(entity_id, None)

    def snapshot(self, entity_ids: Optional[Iterable[str]] = None) -> List[EntityState]:
        if entity_ids is None:
            return self.all()

        ids = set(entity_ids)
        return [s for eid, s in self._states.items() if eid in ids]
