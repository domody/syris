from fastapi import APIRouter
from pydantic import BaseModel
from syris_core import engine

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
def chat(req: ChatRequest):
    reply = engine.ask(req.message)
    return {"response": reply}
