from fastapi import APIRouter, Request

from ...pipeline.run import run_pipeline
from ...schemas.events import RawInput
from ...schemas.pipeline import ExecutionResult

router = APIRouter(tags=["pipeline"])


@router.post("/ingest", response_model=ExecutionResult)
async def ingest(request: Request, body: RawInput) -> ExecutionResult:
    return await run_pipeline(
        body,
        normalizer=request.app.state.normalizer,
        router=request.app.state.router,
        executor=request.app.state.executor,
    )
