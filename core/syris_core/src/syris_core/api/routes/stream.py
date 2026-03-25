import asyncio
import json

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

router = APIRouter(tags=["stream"])


@router.get("/stream/events")
async def stream_events(request: Request) -> StreamingResponse:
    """SSE endpoint that streams all EventBus envelopes to the client.

    Yields ``data: {json}\\n\\n`` lines for each envelope.
    Sends a keepalive comment every 15 seconds when idle.
    Unsubscribes from the bus when the client disconnects.
    """
    bus = request.app.state.event_bus
    queue: asyncio.Queue[dict] = bus.subscribe()

    async def generate():
        try:
            while True:
                try:
                    envelope = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"data: {json.dumps(envelope)}\n\n"
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
        finally:
            bus.unsubscribe(queue)

    return StreamingResponse(generate(), media_type="text/event-stream")
