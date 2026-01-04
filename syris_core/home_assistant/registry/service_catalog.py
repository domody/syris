from dataclasses import dataclass
from typing import Dict, Tuple, Optional

from syris_core.types.home_assistant import DomainServices, ServiceSpec
from syris_core.home_assistant.interface import HomeAssistantInterface

ServiceKey = Tuple[str, str]


@dataclass
class ServiceCatalog:
    _services: Dict[ServiceKey, ServiceSpec]
    ready: bool = False

    @classmethod
    def empty(cls) -> "ServiceCatalog":
        return cls(_services={})

    async def refresh(self, ha: HomeAssistantInterface) -> None:
        raw = await ha.list_services()
        services: Dict[ServiceKey, ServiceSpec] = {}
        for item in raw:
            ds = DomainServices.model_validate(item)
            for svc_name, svc_spec in ds.services.items():
                services[(ds.domain, svc_name)] = svc_spec
        self._services = services
        self.ready = True
        
    def has(self, domain: str, service: str) -> bool:
        return (domain, service) in self._services

    def get(self, domain: str, service: str) -> Optional[ServiceSpec]:
        return self._services.get((domain, service))

    def require(self, domain: str, service: str) -> ServiceSpec:
        spec = self.get(domain, service)
        if not spec:
            raise ValueError(f"HA Service not available: {domain}.{service}")
        return spec
