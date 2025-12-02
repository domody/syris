from fastapi import APIRouter, FastAPI, Depends
import sqlite3
from .db import get_connection, init_db
from contextlib import asynccontextmanager

from pydantic import BaseModel
from typing import Optional
from enum import Enum

class Role(str, Enum):
    user = "user"
    assistant = "assistant"
    system = "system"

class NewChat(BaseModel):
    title: str

class NewMessage(BaseModel):
    role: Role
    content: str
    thinking: Optional[str] = None
    
class RenameChatBody(BaseModel):
    new_title: str
    
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Server startup")
    init_db()
    yield
    print("Server shut down")

router = APIRouter(lifespan=lifespan)

def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()

@router.get("/chats")
def list_chats(db: sqlite3.Connection = Depends(get_db)):
    cur = db.cursor()
    cur.execute("SELECT id, title, created_at, updated_at FROM chats ORDER BY updated_at DESC")
    return [dict(row) for row in cur.fetchall()]

@router.post("/chats")
def create_chat(payload: NewChat, db: sqlite3.Connection = Depends(get_db)):
    cur = db.cursor()
    cur.execute("INSERT INTO chats (title) VALUES (?)", (payload.title,))
    db.commit()
    return {"id": cur.lastrowid, "title": payload.title}

@router.get("/chats/{chat_id}/messages")
def list_messages(chat_id: int, db: sqlite3.Connection = Depends(get_db)):
    cur = db.cursor()
    cur.execute(
        "SELECT id, role, content, thinking, created_at FROM messages WHERE chat_id = ? ORDER BY created_at ASC",
        (chat_id,),
    )
    return [dict(row) for row in cur.fetchall()]

@router.post("/chats/{chat_id}/messages")
def add_message(
    chat_id: int,
    message: NewMessage,
    db: sqlite3.Connection = Depends(get_db)
):
    cur = db.cursor()
    cur.execute(
        """
        INSERT INTO messages (chat_id, role, content, thinking)
        VALUES (?, ?, ?, ?)
        """,
        (chat_id, message.role, message.content, message.thinking)
    )

    db.commit()
    return {"id": cur.lastrowid}

@router.post("/chats/{chat_id}/rename")
def rename_chat(
    chat_id: int,
    body: RenameChatBody,
    db: sqlite3.Connection = Depends(get_db)
):
    cur = db.cursor()
    cur.execute(
        """
        UPDATE chats
        SET title = ?
        WHERE id = ?
        """,
        (body.new_title, chat_id,)
    )

    db.commit()
    return {"id": chat_id, "new_title": body.new_title}

@router.post("/chats/{chat_id}/delete")
def delete_chat(
    chat_id: int,
    db: sqlite3.Connection = Depends(get_db)
):
    cur = db.cursor()
    cur.execute(
        """
        DELETE FROM chats WHERE id = ? 
        """,
        (chat_id,)
    )

    db.commit()

    return  {"status": "ok", "deleted_chat_id": chat_id}