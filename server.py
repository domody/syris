from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn

from core.llm import SyrisLLM
from core.config import MODEL_NAME, SYSTEM_PROMPT

syris = SyrisLLM(model=MODEL_NAME, system_prompt=SYSTEM_PROMPT)

app = FastAPI()

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat_endpoint(req: ChatRequest):
    reply = syris.ask(req.message)
    return {"response": reply}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=4311)