from dataclasses import dataclass
from datetime import datetime, time as dtime
from typing import List, Optional, Dict, Any, Callable, Tuple

from syris_core.automation.rules.models.condition import (
    ConditionSpec,
    TimeWindowCondition,
    WeekdayCondition,
    EntityStateCondition,
    NumericAttributeCondition,
    MissingBehavior,
    NumericOp,
)
from syris_core.home_assistant.registry.state_registry import StateRegistry
from syris_core.types.events import Event


@dataclass(frozen=True)
class EvalContext:
    event: Event
    state_registry: StateRegistry
    now: datetime


@dataclass(frozen=True)
class ConditionResult:
    ok: bool
    reason: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None


def _missing_result(behavior: MissingBehavior, reason: str) -> ConditionResult:
    if behavior == "pass":
        return ConditionResult(ok=True)
    if behavior == "skip":
        return ConditionResult(ok=False, reason=reason)
    return ConditionResult(ok=False, reason=reason)


def _parse_hhmm(s: str) -> dtime:
    hh, mm = s.split(":")
    return dtime(hour=int(hh), minute=int(mm))


class ConditionEvaluator:
    def __init__(self):
        self._handlers: Dict[str, Callable[[Any, EvalContext], ConditionResult]] = {
            "time_window": self._time_window,
            "weekday": self._weekday,
            "entity_state": self._entity_state,
            "numeric_attribute": self._numeric_attribute,
        }

    def evaluate_all(
        self, conditions: List[ConditionSpec], context: EvalContext
    ) -> Tuple[bool, Optional[ConditionResult]]:
        for condition in conditions:
            handler = self._handlers.get(condition.kind)
            if not handler:
                return False, ConditionResult(
                    ok=False,
                    reason="unknown_condition_kind",
                    meta={"kind": condition.kind},
                )
            result = handler(condition, context)
            if not result.ok:
                return False, result
        return True, None

    def _time_window(
        self, cond: TimeWindowCondition, ctx: EvalContext
    ) -> ConditionResult:
        try:
            start = _parse_hhmm(cond.start)
            end = _parse_hhmm(cond.end)
        except Exception:
            return ConditionResult(
                ok=False,
                reason="invalid_time_window",
                meta={"start": cond.start, "end": cond.end},
            )

        now_t = ctx.now.timetz().replace(tzinfo=None)

        if start <= end:
            ok = start <= now_t < end
        else:
            ok = (now_t >= start) or (now_t < end)

        return ConditionResult(
            ok=ok,
            reason=None if ok else "time_window_outside",
            meta={"now": now_t.isoformat()},
        )

    def _weekday(self, cond: WeekdayCondition, ctx: EvalContext) -> ConditionResult:
        wd = ctx.now.isoweekday()
        ok = wd in set(cond.days)
        return ConditionResult(
            ok=ok,
            reason=None if ok else "weekday_mismatch",
            meta={"weekday": wd, "allowed": cond.days},
        )

    def _entity_state(
        self, cond: EntityStateCondition, ctx: EvalContext
    ) -> ConditionResult:
        ent = ctx.state_registry.get(cond.entity_id)
        if ent is None:
            return _missing_result(cond.missing, "missing_entity")

        ok = ent.state == cond.equals
        return ConditionResult(
            ok=ok,
            reason=None if ok else "entity_state_mismatch",
            meta={
                "entity_id": cond.entity_id,
                "actual": ent.state,
                "expected": cond.equals,
            },
        )

    def _numeric_attribute(
        self, cond: NumericAttributeCondition, ctx: EvalContext
    ) -> ConditionResult:
        ent = ctx.state_registry.get(cond.entity_id)
        if ent is None:
            return _missing_result(cond.missing, "missing_entity")

        raw = ent.attributes.get(cond.attribute)
        if raw is None:
            return _missing_result(cond.missing, "missing_attribute")

        try:
            actual = float(raw)
        except Exception:
            return ConditionResult(
                ok=False,
                reason="attribute_not_numeric",
                meta={
                    "entity_id": cond.entity_id,
                    "attribute": cond.attribute,
                    "value": raw,
                },
            )

        ok = _compare(actual, cond.op, cond.value)
        return ConditionResult(
            ok=ok,
            reason=None if ok else "numeric_compare_failed",
            meta={
                "entity_id": cond.entity_id,
                "attribute": cond.attribute,
                "actual": actual,
                "op": cond.op,
                "expected": cond.value,
            },
        )


def _compare(actual: float, op: NumericOp, expected: float) -> bool:
    if op == "lt":
        return actual < expected
    if op == "lte":
        return actual <= expected
    if op == "eq":
        return actual == expected
    if op == "ne":
        return actual != expected
    if op == "gte":
        return actual >= expected
    if op == "gt":
        return actual > expected
    return False
