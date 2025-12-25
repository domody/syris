from dataclasses import dataclass
from typing import Dict, Tuple, Optional

from syris_core.types.home_assistant import DomainServices, ServiceSpec
from syris_core.home_assistant.interface import HomeAssistantInterface

ServiceKey = Tuple[str, str]


@dataclass
class ServiceCatalog:
    _services: Dict[ServiceKey, ServiceSpec]

    @classmethod
    async def build(cls, ha: HomeAssistantInterface) -> "ServiceCatalog":
        raw = await ha.list_services()
        # print(raw)

        services: Dict[ServiceKey, ServiceSpec] = {}

        for item in raw:
            ds = DomainServices.model_validate(item)
            for svc_name, svc_spec in ds.services.items():
                services[(ds.domain, svc_name)] = svc_spec

        return cls(_services=services)

    def has(self, domain: str, service: str) -> bool:
        return (domain, service) in self._services

    def get(self, domain: str, service: str) -> Optional[ServiceSpec]:
        return self._services.get((domain, service))

    def require(self, domain: str, service: str) -> ServiceSpec:
        spec = self.get(domain, service)
        if not spec:
            raise ValueError(f"HA Service not available: {domain}.{service}")
        return spec
