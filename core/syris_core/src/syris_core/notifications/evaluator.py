from ..observability.audit import AuditWriter
from ..schemas.events import MessageEvent
from ..schemas.pipeline import RouteDecision, ExecutionResult


class NotificationEvaluator:
    def __init__(self, audit: AuditWriter):
        self._audit = audit

    async def should_notify(self, event: MessageEvent, decision: RouteDecision, result: ExecutionResult) -> bool:
        # stub: notify if ai judgement was involved
        notify = decision.handler != "llm_conversation"

        await self._audit.emit(
            event.trace_id,
            stage="notification",
            type="notification.triggered" if notify else "notification.suppressed",
            summary=f"Notification {'triggered' if notify else 'suppressed'} for handler={decision.handler} source={event.source}",
            outcome="info" if notify else "suppressed",
            ref_event_id=event.event_id,
        )

        return notify
