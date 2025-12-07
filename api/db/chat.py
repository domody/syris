from pathlib import Path
import sqlite3
from .base import init_db, get_connection

DB_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "chat.db"

SCHEMA = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    thinking TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);
"""

def get_chat_connection() -> sqlite3.Connection:
    return get_connection(DB_PATH, enable_foreign_keys=True)

def init_chat_db():
    init_db(DB_PATH, SCHEMA, enable_foreign_keys=True)