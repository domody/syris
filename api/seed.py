from .db.memory_vector import get_vector_connection as get_connection
import numpy as np
import time


def seed():
    print("Seeding vector_memory database...")

    conn = get_connection()
    cur = conn.cursor()

    # Clear existing rows
    cur.execute("DELETE FROM vector_memory;")

    # Sample dummy memories
    sample_texts = [
        "The user prefers dark mode.",
        "We implemented the new tool metadata system.",
        "The movement prototype for UE5 is complete.",
        "SYRIS should remember long-term goals.",
        "Vector memory testing entry.",
    ]

    entries = []
    for text in sample_texts:
        # Create a simple deterministic embedding (3 floats)
        # Replace with real embeddings later
        vec = np.array(
            [hash(text) % 1000 / 1000.0,
             len(text) % 100 / 100.0,
             (sum(map(ord, text)) % 500) / 500.0],
            dtype=np.float16
        )

        blob = vec.tobytes()
        timestamp = time.time()

        entries.append((blob, text, timestamp))

    # Insert rows
    cur.executemany(
        "INSERT INTO vector_memory (embedding, text, created_at) VALUES (?, ?, ?)",
        entries
    )

    conn.commit()
    conn.close()

    print(f"Inserted {len(entries)} vector memory entries.")
    print("Seed completed.")


if __name__ == "__main__":
    seed()
