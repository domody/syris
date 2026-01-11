import uuid
from typing import Optional
from pydantic import BaseModel
from syris_core.llm.intent.schemas.ha import HAControlArgs, HAQueryArgs
from syris_core.llm.intent.schemas.schedule import (
    ScheduleSetAlarmArgs,
    ScheduleSetReminderArgs,
    ScheduleSetTimerArgs,
)
from .schemas.plan import PlanCreateArgs
from syris_core.types.llm import (
    Intent,
    IntentType,
    BaseIntent,
    ChatIntent,
    ChatArgs,
    ToolIntent,
    ToolArgs,
    ControlIntent,
    ControlArgs,
    ControlAction,
    QueryAction,
    ScheduleIntent,
    ScheduleSetArgs,
    ScheduleAction,
    PlanIntent,
    PlanArgs,
    LLMCallOptions,
)

def build_intent_from_subaction(
    lane_id: str,
    subaction_id: str,
    args: BaseModel,
) -> Optional[Intent]:
    if lane_id == "ha":
        if subaction_id == "control":
            if not isinstance(args, HAControlArgs):
                return None
            return Intent(
                ControlIntent(
                    type=IntentType.CONTROL,
                    confidence=0.9,
                    arguments=ControlArgs(
                        actions=[
                            ControlAction(
                                kind="ha.call_service",
                                domain=args.domain,
                                operation=args.operation,
                                target=args.target,
                                data=args.data or {},
                                requires_confirmation=args.requires_confirmation,
                            )
                        ]
                    ),
                )
            )

        if subaction_id == "query":
            if not isinstance(args, HAQueryArgs):
                return None
            return Intent(
                ControlIntent(
                    type=IntentType.CONTROL,
                    confidence=0.9,
                    arguments=ControlArgs(
                        actions=[
                            QueryAction(
                                kind="ha.state_query",
                                domain=args.domain,
                                target=args.target,
                                query=args.query,
                            )
                        ]
                    ),
                )
            )

    if lane_id == "schedule":
        if subaction_id == "set_timer":
            if not isinstance(args, ScheduleSetTimerArgs):
                return None
        elif subaction_id == "set_alarm":
            if not isinstance(args, ScheduleSetAlarmArgs):
                return None
        elif subaction_id == "set_reminder":
            if not isinstance(args, ScheduleSetReminderArgs):
                return None
        else:
            return None

        schedule_id = f"{subaction_id}-{uuid.uuid4().hex}"
        label = getattr(args, "label", None)
        message = getattr(args, "message", None)
        if label is None and message:
            label = message

        if subaction_id == "set_timer":
            delay_seconds = getattr(args, "duration_seconds", None)
            kind = "timer"
        elif subaction_id == "set_alarm":
            delay_seconds = None
            kind = "alarm"
        elif subaction_id == "set_reminder":
            delay_seconds = None
            kind = "alarm"

        return Intent(
            ScheduleIntent(
                type=IntentType.SCHEDULE,
                subtype=None,
                confidence=0.9,
                arguments=ScheduleSetArgs(
                    subtype=ScheduleAction.SET,
                    id=schedule_id,
                    kind=kind,
                    delay_seconds=delay_seconds,
                    run_at=getattr(args, "run_at", None),
                    cron=None,
                    time_expression=getattr(args, "time_expression", None),
                    label=label,
                ),
            )
        )

    if lane_id == "tool":
        tool_payload = getattr(args, "arguments", {})
        return Intent(
            ToolIntent(
                type=IntentType.TOOL,
                subtype=[subaction_id],
                confidence=0.9,
                arguments=ToolArgs(arguments={subaction_id: tool_payload}),
            )
        )

    if lane_id == "plan":
        if subaction_id == "create_plan":
            if not isinstance(args, PlanCreateArgs):
                return None
            
            return Intent(
                PlanIntent(
                    type=IntentType.PLAN,
                    confidence=0.9,
                    arguments=PlanArgs(
                        goal=args.goal,
                        context=args.context,
                        output_format=args.output_format
                    )
                )
            )
        
    return None
