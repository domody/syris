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

        await asyncio.gather(
            *(channel.send(notification) for channel in self._channels),
            return_exceptions=True
        )
        
        # Alternative method for sequential notification sending is below
        # If one notification hangs, then everything blocks, above method
        # is safer.
        
        # for channel in self._channels:
        #     await channel.send(notification)

    def _build(self, event: MessageEvent, decision: RouteDecision, result: ExecutionResult) -> Notification:
        return Notification(
            title="Assistant action taken",
            body=f"Handler: {decision.handler} · Source: {event.source}",
            metadata={"handler": decision.handler, "source": event.source},
        )