from fastapi import APIRouter, FastAPI, Depends
import sqlite3
from ..db.memory_vector import get_vector_connection, init_vector_db
from contextlib import asynccontextmanager
import base64
import numpy as np


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Memory router startup")
    init_vector_db()
    yield
    print("Memory router shut down")


router = APIRouter(lifespan=lifespan)


def get_db():
    conn = get_vector_connection()
    try:
        yield conn
    finally:
        conn.close()


@router.get("/vector")
def list_vectors(db: sqlite3.Connection = Depends(get_db)):
    cur = db.cursor()
    cur.execute(
        "SELECT id, embedding, text, created_at FROM vector_memory ORDER BY created_at DESC"
    )

    results = []
    for row in cur.fetchall():
        vec = np.frombuffer(row["embedding"], dtype=np.float16).tolist()

        results.append(
            {
                "id": row["id"],
                "embedding": vec,
                "text": row["text"],
                "created_at": row["created_at"],
            }
        )

    return results


@router.post("/vector/{vector_id}/delete")
def delete_vector(vector_id: int, db: sqlite3.Connection = Depends(get_db)):
    cur = db.cursor()
    cur.execute(
        """
        DELETE FROM vector_memory WHERE id = ? 
        """,
        (vector_id,),
    )

    db.commit()

    return {"status": "ok", "deleted_chat_id": vector_id}
