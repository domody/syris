from typing import Any

from pydantic import BaseModel, Field

from syris_core.types.llm import ControlDomain, ControlOperation, TargetSpec, StateQueryKind


class HAControlArgs(BaseModel):
    domain: ControlDomain = Field(
        description="Target Home Assistant domain for the control action (light, climate, cover, etc.)."
    )
    operation: ControlOperation = Field(
        description="Specific control operation to perform for the target domain."
    )
    target: TargetSpec = Field(
        description="Target specification describing which entity or area the action applies to."
    )
    data: dict[str, Any] = Field(
        default_factory=dict,
        description="Additional service data needed for the control operation.",
    )
    requires_confirmation: bool = Field(
        default=False,
        description="Whether the action should request confirmation before execution.",
    )


class HAQueryArgs(BaseModel):
    domain: ControlDomain = Field(
        description="Target Home Assistant domain to query (light, climate, cover, etc.)."
    )
    target: TargetSpec = Field(
        description="Target specification describing which entity or area to query."
    )
    query: StateQueryKind = Field(
        description="Kind of state or attribute to retrieve from the target.",
    )
