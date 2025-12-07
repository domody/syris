import ollama
from ollama import EmbedResponse
import sqlite3
import time
import numpy as np
from pathlib import Path
from typing import Sequence

def embed(text: str) -> np.ndarray:
    response = ollama.embed(
        model="qwen3-embedding",
        input=text
    )
    emb = np.array(response.embeddings[0], dtype=np.float32)
    return emb

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0.0
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def store_vector_memory(text: str, db_path=Path(__file__).parent.parent.parent / "data" / "memory_vector.db"):
    embedding = embed(text).astype(np.float16)

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO vector_memory (embedding, text, created_at)
        VALUES (?, ?, ?)
    """, (embedding.tobytes(), text, time.time()))

    conn.commit()
    conn.close()


# TODO: add reranking algorithm when querying vector memory
def query_vector_memory(query: str, top_k: int = 3, db_path=Path(__file__).parent.parent.parent / "data" / "memory_vector.db"
):
    query_emb = embed(query)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    rows = cur.execute("SELECT id, embedding, text FROM vector_memory").fetchall()
    conn.close()

    scored = []

    for _id, emb_blob, text in rows:
        emb = np.frombuffer(emb_blob, dtype=np.float16).astype(np.float32)

        score = cosine_similarity(query_emb, emb)
        scored.append((score, text))

    scored.sort(reverse=True)
    return scored[:top_k]

