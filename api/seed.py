from .db import get_connection

def seed():
    conn = get_connection()
    cur = conn.cursor()

    # Clear existing
    cur.executescript("""
        DELETE FROM messages;
        DELETE FROM chats;
    """)

    # Insert sample chats
    chats = [
        ("First Chat",),
        ("Project Discussion",),
        ("Random Thoughts",)
    ]
    cur.executemany("INSERT INTO chats (title) VALUES (?)", chats)

    # Fetch chat IDs
    cur.execute("SELECT id FROM chats ORDER BY id ASC")
    chat_ids = [row["id"] for row in cur.fetchall()]

    # Insert messages
    messages = [
        (chat_ids[0], "user", "Hey, how are you?"),
        (chat_ids[0], "assistant", "I'm quite well, thank you."),

        (chat_ids[1], "user", "Let's plan the next sprint."),
        (chat_ids[1], "assistant", "Sure. What are the priorities?"),

        (chat_ids[2], "user", "Write down this idea."),
    ]
    cur.executemany(
        "INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)",
        messages
    )

    conn.commit()
    conn.close()
    print("Seed completed.")

if __name__ == "__main__":
    seed()
