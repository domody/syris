import json
import os


class Memory:
    def __init__(self, long_term_file="data/memory.json", max_short_term=20):
        self.long_term_file = long_term_file
        self.max_short_term = max_short_term

        self.short_term = []

        self.long_term = self._load_long_term()

    # ---
    # Short term memory
    # ---

    def add(self, role, content):
        self.short_term.append({"role": role, "content": content})

        if len(self.short_term) > self.max_short_term:
            self.short_term.pop(0)

    def get_context(self):
        return self.short_term[:]

    # ---
    # Long term memory
    # ---

    def remember(self, text):
        self.long_term.append(text)
        self._save_long_term()

    def recall(self):
        return self.long_term

    # ---
    # i/o helpers
    # ---

    def _load_long_term(self):
        if not os.path.exists(self.long_term_file):
            return []

        try:
            with open(self.long_term_file, "r", encoding="utf-8") as f:
                return json.load(f)

        except:
            return []

    def _save_long_term(self):
        os.makedirs(os.path.dirname(self.long_term_file), exist_ok=True)
        with open(self.long_term_file, "w", encoding="utf-8") as f:
            json.dump(self.long_term, f, indent=4)
