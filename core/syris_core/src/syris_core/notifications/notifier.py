import asyncio

from ..observability.audit import AuditWriter
from ..schemas.notifications import Notification, NotificationChannel
from ..schemas.events import MessageEvent
from ..schemas.pipeline import RouteDecision, ExecutionResult


class Notifier:
    def __init__(self, audit: AuditWriter):
        self._audit = audit
        self._channels: list[NotificationChannel] = []

    def register(self, channel: NotificationChannel) -> None:
        self._channels.append(channel)

    async def notify(self, event: MessageEvent, decision: RouteDecision, result: ExecutionResult) -> None:
        notification = self._build(event, decision, result)

        async with self._audit.span(
            event.trace_id,
            stage="notification",
            type="notification.sent",
            summary=f"Sending notification via {len(self._channels)} channel(s) for handler={decision.handler}",
            ref_event_id=event.event_id,
        ) as span:
            await asyncio.gather(
                *(channel.send(notification) for channel in self._channels),
                return_exceptions=True,
            )
            span.outcome = "success"
            span.summary = f"Notification sent via {len(self._channels)} channel(s) for handler={decision.handler} source={event.source}"

    def _build(self, event: MessageEvent, decision: RouteDecision, result: ExecutionResult) -> Notification:
        return Notification(
            title="Assistant action taken",
            body=f"Handler: {decision.handler} · Source: {event.source}",
            metadata={"handler": decision.handler, "source": event.source},
        )
