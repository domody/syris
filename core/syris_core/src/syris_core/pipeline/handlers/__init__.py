"""Pipeline fastpath handler factories."""
from .approvals import (
    make_approval_approve_handler,
    make_approval_deny_handler,
    make_approval_list_handler,
)
from .autonomy import make_autonomy_set_handler
from .rules import (
    make_rule_create_handler,
    make_rule_disable_handler,
    make_rule_enable_handler,
    make_rule_list_handler,
)
from .schedules import (
    make_schedule_cancel_handler,
    make_schedule_list_handler,
    make_schedule_pause_handler,
)
from .tasks import make_task_cancel_handler, make_task_status_handler
from .timer import make_timer_set_handler

__all__ = [
    "make_timer_set_handler",
    "make_task_status_handler",
    "make_task_cancel_handler",
    "make_autonomy_set_handler",
    "make_approval_list_handler",
    "make_approval_approve_handler",
    "make_approval_deny_handler",
    "make_schedule_list_handler",
    "make_schedule_cancel_handler",
    "make_schedule_pause_handler",
    "make_rule_list_handler",
    "make_rule_enable_handler",
    "make_rule_disable_handler",
    "make_rule_create_handler",
]
