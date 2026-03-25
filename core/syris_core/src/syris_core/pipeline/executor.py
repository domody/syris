import logging

from ..observability.audit import AuditWriter
from ..schemas.events import MessageEvent
from ..schemas.pipeline import ExecutionOutcome, ExecutionResult, RouteDecision

logger = logging.getLogger(__name__)


class Executor:
    """Executes the handler indicated by a RouteDecision.

    Currently a stub — always returns a NOOP result.
    # TODO: dispatch to real handler registry
    """

    def __init__(self, audit: AuditWriter) -> None:
        self._audit = audit

    async def execute(
        self, decision: RouteDecision, event: MessageEvent
    ) -> ExecutionResult:
        async with self._audit.span(
            event.trace_id,
            stage="execute",
            type="event.executed",
            summary=f"MessageEvent {event.event_id} executing via {decision.handler}",
            outcome="info",
            ref_event_id=event.event_id,
        ) as span:
            # TODO: dispatch to real handler registry
            result = ExecutionResult(
                event_id=event.event_id,
                trace_id=event.trace_id,
                handler=decision.handler,
                outcome=ExecutionOutcome.NOOP,
                detail=f"stub executor: handler '{decision.handler}' not implemented",
            )
            span.outcome = "success"
            span.summary = (
                f"MessageEvent {event.event_id} executed via {decision.handler}: noop"
            )

        logger.info(
            "event.executed event_id=%s handler=%s outcome=%s",
            event.event_id,
            decision.handler,
            result.outcome,
        )
        return result
