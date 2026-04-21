from ..observability.audit import AuditWriter
from ..schemas.events import MessageEvent
from ..schemas.pipeline import RouteDecision, ExecutionResult

class NotificationEvaluator:
    def __init__(self, audit: AuditWriter):
        self._audit = audit

    def should_notify(self, event: MessageEvent, decision: RouteDecision, result: ExecutionResult) -> bool:
        # stub: notify if ai judgement was involved
        return decision.handler == "agent"