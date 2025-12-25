from datetime import datetime
from typing import Any, Dict, Optional, Literal
from pydantic import BaseModel, Field

from syris_core.types.llm import TargetSpec


class EntityContext(BaseModel):
    id: Optional[str] = None
    parent_id: Optional[str] = None
    user_id: Optional[str] = None


class EntityState(BaseModel):
    entity_id: str
    state: str
    attributes: Dict[str, Any] = Field(default_factory=dict)

    last_changed: Optional[datetime] = None
    last_reported: Optional[datetime] = None
    last_updated: Optional[datetime] = None
    context: Optional[EntityContext] = None

    @property
    def domain(self) -> str:
        return self.entity_id.split(".", 1)[0]

    @property
    def friendly_name(self) -> str:
        return str(self.attributes.get("friendly_name", self.entity_id))


class ServiceFieldSpec(BaseModel):
    required: Optional[bool] = None
    example: Optional[Any] = None
    selector: Optional[Dict[str, Any]] = None
    description: Optional[str] = None


class ServiceSpec(BaseModel):
    description: Optional[str] = None
    fields: Dict[str, ServiceFieldSpec] = Field(default_factory=dict)


class DomainServices(BaseModel):
    domain: str
    services: Dict[str, ServiceSpec] = Field(default_factory=dict)


class EntityView(BaseModel):
    entity_id: str
    name: str
    domain: str
    state: str
    attributes: Dict[str, Any] = Field(default_factory=dict)


class ControlResult(BaseModel):
    kind: Literal["ha.control_result"] = "ha.control_result"
    domain: str
    operation: str
    target: TargetSpec
    entity_ids: list[str]
    success: bool = True
    
class QueryResult(BaseModel):
    kind: Literal["ha.query_result"] = "ha.query_result"
    domain: str
    query: str
    target: TargetSpec
    entities: list[EntityView]
    summary: Dict[str, Any]