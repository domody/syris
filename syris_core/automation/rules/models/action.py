from typing import Annotated, Union
from pydantic import Field

from syris_core.types.llm import ControlAction

ActionSpec = Annotated[
    Union[ControlAction],
    Field(discriminator="kind")
]