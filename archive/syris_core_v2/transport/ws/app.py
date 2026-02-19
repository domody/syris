from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from contextlib import asynccontextmanager

from .hub import Hub
from .session import Session
from .tap import EventTap
from .history import EventHistory
from syris_core.core.orchestrator import Orchestrator
from syris_core.events.bus import EventBus

def create_app(*, orchestrator: Orchestrator, event_bus: EventBus) -> FastAPI:
    app = FastAPI()

    history = EventHistory(max_events=10_000, per_index_limit=2_000)
    hub = Hub(history=history)
    tap = EventTap(event_bus=event_bus, hub=hub, history=history)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        await tap.start()
        yield
        await tap.stop()
        await hub.close_all()
        
    @app.on_event("startup")
    async def _startup() -> None:
        await tap.start()

    @app.on_event("shutdown")
    async def _shutdown() -> None:
        await tap.stop()
        await hub.close_all()

    @app.get("/healthz")
    async def healthz():
        return {
            "ok": True,
            "clients": hub.client_count(),
            "history_size": history.size(),
        }

    @app.websocket("/ws")
    async def ws_endpoint(ws: WebSocket):
        await ws.accept()

        session = Session(ws=ws, hub=hub, history=history, orchestrator=orchestrator)

        await hub.register(session)
        try:
            await session.run()
        except WebSocketDisconnect:
            pass
        finally:
            await hub.unregister(session)

    return app
