import asyncio


MAX_QUEUE_SIZE = 100


class EventBus:
    """In-process pub/sub bus for real-time event streaming.

    Publishers call publish() without knowing about SSE or HTTP.
    SSE clients call subscribe() to get a queue, and unsubscribe() on disconnect.
    If no clients are connected, publish() is a no-op.
    """

    def __init__(self, max_queue_size: int = MAX_QUEUE_SIZE) -> None:
        self._subscribers: list[asyncio.Queue[dict]] = []
        self._max_queue_size = max_queue_size

    def subscribe(self) -> asyncio.Queue[dict]:
        """Register a new subscriber and return its queue."""
        q: asyncio.Queue[dict] = asyncio.Queue(maxsize=self._max_queue_size)
        self._subscribers.append(q)
        return q

    def unsubscribe(self, queue: asyncio.Queue[dict]) -> None:
        """Remove a subscriber queue (idempotent)."""
        try:
            self._subscribers.remove(queue)
        except ValueError:
            pass

    def publish(self, envelope: dict) -> None:
        """Put envelope on every subscriber queue.

        If a queue is full, the oldest item is dropped to make room (drop-oldest).
        If no subscribers are registered, this is a no-op.
        """
        for q in self._subscribers:
            if q.full():
                try:
                    q.get_nowait()
                except asyncio.QueueEmpty:
                    pass
            try:
                q.put_nowait(envelope)
            except asyncio.QueueFull:
                pass
