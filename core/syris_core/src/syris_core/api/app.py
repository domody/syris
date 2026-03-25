from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ..config import Settings
from .routes.audit import router as audit_router
from .routes.health import router as health_router
from .routes.ingest import router as ingest_router
from .routes.stream import router as stream_router

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

def create_app(settings: Settings) -> FastAPI:
    app = FastAPI(
        title="syris-core",
        version=settings.version
    )
    app.state.settings = settings # Control plane will overwrite or extend this at runtime
    app.include_router(health_router)
    app.include_router(audit_router)
    app.include_router(ingest_router)
    app.include_router(stream_router)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    return app
