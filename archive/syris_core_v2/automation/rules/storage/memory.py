from typing import List
from syris_core.automation.rules.models.rule import Rule
from syris_core.automation.rules.models.trigger import DeviceTrigger
from syris_core.types.llm import (
    ControlAction,
    TargetSpec,
    HomeTarget,
    ControlDomain,
    ControlOperation,
)
from syris_core.automation.rules.models.condition import TimeWindowCondition

def load_rules() -> List[Rule]:
    return [
        Rule(
            id="demo_toggle_lights_on_boolean",
            name="Demo: toggle lights when boolean turns on",
            trigger=DeviceTrigger(
                entity_id="input_boolean.demo_rule_trigger",
                to_state="on",
                from_state="off",
            ),
            actions=[
                ControlAction(
                    kind="ha.call_service",
                    domain=ControlDomain.LIGHT,
                    operation=ControlOperation.POWER_TOGGLE,
                    target=HomeTarget(scope="home", selector="all"),
                    data={
                        "brightness": 51
                    },
                    requires_confirmation=False,
                )
            ],
            conditions=[
                TimeWindowCondition(
                    kind = "time_window",
                    start = "22:00",
                    end = "4:00"
                )
            ]
        ),
    ]
