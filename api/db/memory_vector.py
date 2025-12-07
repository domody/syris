from pathlib import Path
import sqlite3
from .base import get_connection, init_db

DB_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "memory_vector.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS vector_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    embedding BLOB NOT NULL,
    text TEXT NOT NULL,
    created_at REAL NOT NULL
);
"""

def get_vector_connection() -> sqlite3.Connection:
    return get_connection(DB_PATH, enable_foreign_keys=False)

def init_vector_db():
    init_db(DB_PATH, SCHEMA, enable_foreign_keys=False)