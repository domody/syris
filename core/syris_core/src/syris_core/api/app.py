from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ..config import Settings
from .routes.approvals import router as approvals_router
from .routes.audit import router as audit_router
from .routes.events import router as events_router
from .routes.controls import router as controls_router
from .routes.health import router as health_router
from .routes.ingest import router as ingest_router
from .routes.rules import router as rules_router
from .routes.schedules import router as schedules_router
from .routes.stream import router as stream_router
from .routes.tasks import router as tasks_router
from .routes.watchers import router as watchers_router

# origins = [
#     "http://localhost:3000",
#     "http://localhost:3001",
#     "http://127.0.0.1:3000",
#     "http://127.0.0.1:3001",
# ]

origin_regex = r"^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$|^https:\/\/([a-zA-Z0-9-]+\.)*syris\.uk$"

def create_app(settings: Settings) -> FastAPI:
    app = FastAPI(
        title="syris-core",
        version=settings.version
    )
    app.state.settings = settings # Control plane will overwrite or extend this at runtime
    app.include_router(health_router)
    app.include_router(audit_router)
    app.include_router(events_router)
    app.include_router(ingest_router)
    app.include_router(stream_router)
    app.include_router(tasks_router)
    app.include_router(approvals_router)
    app.include_router(controls_router)
    app.include_router(rules_router)
    app.include_router(schedules_router)
    app.include_router(watchers_router)
    app.add_middleware(
        CORSMiddleware,
        # allow_origins=origins,
        allow_origin_regex=origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    return app
