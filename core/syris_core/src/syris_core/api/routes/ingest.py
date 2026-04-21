from fastapi import APIRouter, Request

from ...pipeline.run import run_pipeline
from ...schemas.events import RawInput
from ...schemas.pipeline import IngestResponse

router = APIRouter(tags=["pipeline"])


@router.post("/ingest", response_model=IngestResponse)
async def ingest(request: Request, body: RawInput) -> IngestResponse:
    return await run_pipeline(
        body,
        normalizer=request.app.state.normalizer,
        router=request.app.state.router,
        executor=request.app.state.executor,
        responder=request.app.state.responder,
        notifier=request.app.state.notifier,
    )
