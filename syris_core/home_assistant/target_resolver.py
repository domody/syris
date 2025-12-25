from syris_core.types.llm import TargetSpec
from syris_core.types.home_assistant import EntityState


class TargetResolver:
    def resolve(
        self, *, target: TargetSpec, domain: str, entities: list[EntityState]
    ) -> list[str]:
        domain_entities = [e for e in entities if e.domain == domain]

        if target.scope == "home":
            if target.selector == "all":
                return [e.entity_id for e in domain_entities]
            elif target.selector == "one":
                return (
                    [
                        sorted(domain_entities, key=lambda e: e.friendly_name)[
                            0
                        ].entity_id
                    ]
                    if domain_entities
                    else []
                )

        if target.scope == "entity_id":
            wanted = set(target.entity_ids or [])
            return [e.entity_id for e in domain_entities if e.entity_id in wanted]

        if target.scope == "name" and target.name:
            name = target.name.lower()
            matches = [e for e in domain_entities if name in e.friendly_name.lower()]
            return [m.entity_id for m in matches]

        return []
