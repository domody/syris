from pydantic import BaseModel, Field
from typing import Literal, Annotated, Union, List

MissingBehavior = Literal["fail", "pass", "skip"]
NumericOp = Literal["lt", "lte", "eq", "ne", "gte", "gt"]

class TimeWindowCondition(BaseModel):
    kind: Literal["time_window"]
    start: str
    end: str
    missing: MissingBehavior = "fail"

class WeekdayCondition(BaseModel):
    kind: Literal["weekday"]
    days: List[int]
    missing: MissingBehavior = "fail"

class EntityStateCondition(BaseModel):
    kind: Literal["entity_state"]
    entity_id: str
    equals: str
    missing: MissingBehavior = "fail"

class NumericAttributeCondition(BaseModel):
    kind: Literal["numeric_attribute"]
    entity_id: str
    attribute: str
    op: NumericOp = "eq"
    value: float
    missing: MissingBehavior = "fail"

ConditionSpec = Annotated[
    Union[
        TimeWindowCondition,
        WeekdayCondition,
        EntityStateCondition,
        NumericAttributeCondition
    ],
    Field(discriminator="kind")
]