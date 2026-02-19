# test_vector_memory.py
import sqlite3
from vector_memory import query_vector_memory, store_vector_memory, embed
from pathlib import Path

DB_PATH = Path(__file__).parent.parent.parent / "data" / "memory_vector.db"

# store_vector_memory("The user prefers dark mode.")
# store_vector_memory("We decided to add the metadata typing using TypedDict.")
# store_vector_memory("The movement system prototype for UE5 was created today.")
# store_vector_memory("We implemented the new TOOL_MAP format with dicts.")

if __name__ == "__main__":
    print("Query: 'What typing system did we choose?'\n")
    results = query_vector_memory(
        "what typing system did we use", top_k=4, db_path=DB_PATH
    )

    for score, text in results:
        print(f"{score:.3f} - {text}")
