from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from syris_core import engine
import json

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
def chat(req: ChatRequest):
    reply = engine.ask(req.message)
    return {"response": reply}

@router.get("/stream")
async def stream_chat(message: str):
    async def token_generator():
        async for token in engine.stream(message):
            safe = json.dumps({"token": token})
            yield f"data: {safe}\n\n"
        yield "data: {\"token\": \"[END]\"}\n\n"

    return StreamingResponse(
        token_generator(),
        media_type="text/event-stream"
    )
