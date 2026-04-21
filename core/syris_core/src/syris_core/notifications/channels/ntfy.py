import httpx
from ...schemas.notifications import Notification, NotificationChannel

class NtfyChannel(NotificationChannel):
    def __init__(self, topic: str, server: str = "https://ntfy.sh"):
        self._url = f"{server}/{topic}"

    async def send(self, notification: Notification) -> None:
        async with httpx.AsyncClient() as client:
            await client.post(
                self._url,
                headers={
                    "Title": notification.title,
                    "Content-Type": "text/plain"
                },
                content=notification.body
            )