import logging
import time
from typing import Any, Callable, Coroutine

from ..observability.audit import AuditWriter
from ..schemas.events import MessageEvent
from ..schemas.pipeline import ExecutionOutcome, ExecutionResult, RouteDecision

logger = logging.getLogger(__name__)

# A PipelineHandler receives the event and routing decision, performs work,
# and returns a short detail string. Raising signals failure.
PipelineHandler = Callable[
    [MessageEvent, RouteDecision],
    Coroutine[Any, Any, str],
]


class Executor:
    """Dispatches a RouteDecision to a registered handler.

    Handlers are injected at construction time. Each handler is an async
    callable ``(MessageEvent, RouteDecision) → str``.

    Audit events emitted per execution:
    - ``tool_call.attempted``  before invocation
    - ``tool_call.succeeded``  on success
    - ``tool_call.failed``     on exception
    """

    def __init__(
        self,
        audit: AuditWriter,
        handlers: dict[str, PipelineHandler] | None = None,
    ) -> None:
        self._audit = audit
        self._handlers: dict[str, PipelineHandler] = handlers or {}

    async def execute(
        self, decision: RouteDecision, event: MessageEvent
    ) -> ExecutionResult:
        handler_fn = self._handlers.get(decision.handler)

        _SILENT_NOOP_HANDLERS = {"unroutable", "llm_conversation"}
        if handler_fn is None:
            if decision.handler not in _SILENT_NOOP_HANDLERS:
                logger.warning(
                    "executor.no_handler handler=%s event_id=%s",
                    decision.handler,
                    event.event_id,
                )
            return ExecutionResult(
                event_id=event.event_id,
                trace_id=event.trace_id,
                handler=decision.handler,
                outcome=ExecutionOutcome.NOOP,
                detail=f"no handler registered for '{decision.handler}'",
            )

        t0 = time.monotonic()

        await self._audit.emit(
            event.trace_id,
            stage="tool_call",
            type="tool_call.attempted",
            summary=f"Calling '{decision.handler}' for event {event.event_id}",
            outcome="info",
            ref_event_id=event.event_id,
            tool_name=decision.handler,
        )

        try:
            detail = await handler_fn(event, decision)
            latency_ms = int((time.monotonic() - t0) * 1_000)

            await self._audit.emit(
                event.trace_id,
                stage="tool_call",
                type="tool_call.succeeded",
                summary=f"Handler '{decision.handler}' succeeded: {detail}",
                outcome="success",
                ref_event_id=event.event_id,
                tool_name=decision.handler,
                latency_ms=latency_ms,
            )

            logger.info(
                "executor.succeeded handler=%s event_id=%s",
                decision.handler,
                event.event_id,
            )
            return ExecutionResult(
                event_id=event.event_id,
                trace_id=event.trace_id,
                handler=decision.handler,
                outcome=ExecutionOutcome.SUCCESS,
                detail=detail,
                latency_ms=latency_ms,
            )

        except Exception as exc:
            latency_ms = int((time.monotonic() - t0) * 1_000)

            await self._audit.emit(
                event.trace_id,
                stage="tool_call",
                type="tool_call.failed",
                summary=f"Handler '{decision.handler}' failed: {exc}",
                outcome="failure",
                ref_event_id=event.event_id,
                tool_name=decision.handler,
                latency_ms=latency_ms,
            )

            logger.exception(
                "executor.failed handler=%s event_id=%s", decision.handler, event.event_id
            )
            return ExecutionResult(
                event_id=event.event_id,
                trace_id=event.trace_id,
                handler=decision.handler,
                outcome=ExecutionOutcome.FAILURE,
                detail=str(exc),
                latency_ms=latency_ms,
            )
