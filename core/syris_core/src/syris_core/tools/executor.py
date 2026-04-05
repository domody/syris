"""
ToolExecutor — dispatch engine for the tool registry.

Sequence for every tool call:
  1. Lookup tool class in registry
  2. Validate raw_args against args_schema
  3. Gate check (only when gate_checker is provided)
  4. Execute with audit span
  5. Return ToolResult

The gate_checker should be None when constructing step handlers for
TaskEngine — StepRunner already owns gate checking at the step level.
Pass gate_checker only for direct dispatch (e.g. LLMConversationHandler).
"""
import logging
from typing import Any, Callable, Coroutine
from uuid import UUID

import structlog

from ..safety.gates import GateChecker
from .base import BaseTool, ToolDeps, ToolResult
from .registry import ToolRegistry, StepHandler

logger = structlog.get_logger(__name__)


class ToolNotFoundError(Exception):
    """Raised when the requested tool is not in the registry."""


class ToolValidationError(ValueError):
    """Raised when args fail schema validation."""


class ToolGatedError(PermissionError):
    """Raised when the gate blocks execution (CONFIRM, PREVIEW, HARD_BLOCK)."""

    def __init__(self, action: str, reason: str, tool_name: str) -> None:
        super().__init__(f"Gate {action} for '{tool_name}': {reason}")
        self.gate_action = action


class ToolExecutor:
    """
    Validates, gates, executes, and audits tool calls.

    Constructed once with shared deps. Thread-safe — holds no mutable state.
    """

    def __init__(
        self,
        registry: ToolRegistry,
        deps: ToolDeps,
        gate_checker: GateChecker | None = None,
    ) -> None:
        self._registry = registry
        self._deps = deps
        self._gate_checker = gate_checker

    async def execute(
        self,
        tool_name: str,
        raw_args: dict[str, Any],
        *,
        trace_id: UUID,
        idempotency_key: str,
        autonomy_level: str | None = None,
        ref_task_id: UUID | None = None,
        ref_step_id: UUID | None = None,
    ) -> ToolResult:
        """
        Full dispatch: lookup → validate → gate → audit span → execute.

        Raises:
            ToolNotFoundError   — tool_name not in registry
            ToolValidationError — raw_args fails args_schema validation
            ToolGatedError      — gate returns CONFIRM, PREVIEW, or HARD_BLOCK
        """
        tool_cls = self._registry.get(tool_name)
        if tool_cls is None:
            raise ToolNotFoundError(f"Tool '{tool_name}' not registered")

        # Validate args
        try:
            validated_args = tool_cls.args_schema.model_validate(raw_args)
        except Exception as exc:
            raise ToolValidationError(
                f"Tool '{tool_name}' args validation failed: {exc}"
            ) from exc

        # Gate check (only when gate_checker is injected — direct dispatch)
        if self._gate_checker is not None:
            level = autonomy_level or await self._gate_checker.current_autonomy_level()
            gate_decision = await self._gate_checker.check(
                trace_id=trace_id,
                tool_name=tool_name,
                risk_level=tool_cls.risk_level,
                autonomy_level=level,
                what={"tool_name": tool_name, "args": raw_args},
                why=f"Direct pipeline dispatch: {tool_name}",
                ref_task_id=ref_task_id,
                ref_step_id=ref_step_id,
            )
            if gate_decision.action != "ALLOW":
                raise ToolGatedError(gate_decision.action, gate_decision.reason, tool_name)

        # Execute with audit span
        tool_instance = tool_cls(self._deps)

        async with self._deps.audit.span(
            trace_id,
            stage="tool_call",
            type="tool_call.attempted",
            summary=f"Executing tool '{tool_name}'",
            outcome="info",
            tool_name=tool_name,
            risk_level=tool_cls.risk_level,
            ref_task_id=ref_task_id,
            ref_step_id=ref_step_id,
        ) as span:
            result = await tool_instance.execute(validated_args)
            span.outcome = "success"
            span.summary = f"Tool '{tool_name}' succeeded: {result.summary}"

        return result

    def make_step_handler(self, tool_name: str) -> StepHandler:
        """
        Return a StepHandler closure for TaskEngine injection.

        Bridges the StepHandler protocol (dict → dict) to execute().
        The following keys are extracted from input_payload and NOT passed
        to the tool as args (they are internal pipeline metadata):
            _trace_id         str UUID
            _idempotency_key  str
            _ref_task_id      str UUID (optional)
            _ref_step_id      str UUID (optional)
        """
        executor = self

        async def handler(input_payload: dict[str, Any]) -> dict[str, Any]:
            trace_id_raw = input_payload.get("_trace_id")
            idempotency_key = input_payload.get("_idempotency_key", "unknown")
            ref_task_id_raw = input_payload.get("_ref_task_id")
            ref_step_id_raw = input_payload.get("_ref_step_id")

            trace_id = UUID(str(trace_id_raw)) if trace_id_raw else UUID(int=0)
            ref_task_id = UUID(str(ref_task_id_raw)) if ref_task_id_raw else None
            ref_step_id = UUID(str(ref_step_id_raw)) if ref_step_id_raw else None

            clean_args = {k: v for k, v in input_payload.items() if not k.startswith("_")}

            result = await executor.execute(
                tool_name,
                clean_args,
                trace_id=trace_id,
                idempotency_key=idempotency_key,
                ref_task_id=ref_task_id,
                ref_step_id=ref_step_id,
            )
            return {"_summary": result.summary, **result.data}

        return handler
