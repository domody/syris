from pathlib import Path
import sqlite3


def get_connection(db_path: Path, enable_foreign_keys: bool = True):
    db_path.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    if enable_foreign_keys:
        conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db(db_path: Path, schema_sql: str, enable_foreign_keys: bool = True) -> None:
    conn = get_connection(db_path=db_path, enable_foreign_keys=enable_foreign_keys)
    cur = conn.cursor()

    cur.executescript(schema_sql)

    conn.commit()
    conn.close()
