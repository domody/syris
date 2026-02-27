from fastapi import FastAPI

from ..config import Settings
from ..api.routes.health import router as health_router

def create_app(settings: Settings) -> FastAPI:
    app = FastAPI(
        title="syris-core",
        version=settings.version
    )
    app.state.settings = settings # Control plane will overwrite or extend this at runtime
    app.include_router(health_router)
    return app
