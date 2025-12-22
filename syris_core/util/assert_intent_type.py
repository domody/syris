from typing import Type, TypeVar

from syris_core.types.llm import Intent, ChatIntent, ToolIntent, ScheduleIntent, ControlIntent, IntentType, ChatArgs

T = TypeVar("T")

def assert_intent_type(*, intent: Intent, expected_type: Type[T]) -> T:
    obj = intent.root

    if not isinstance(obj, expected_type):
        raise ValueError(
            f"Intent is {type(obj).__name__}, expected {expected_type.__name__}"
        )
    
    return obj
