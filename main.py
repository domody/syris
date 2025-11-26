from core.llm import SyrisLLM
from core.config import MODEL_NAME, SYSTEM_PROMPT

def main():
    syris = SyrisLLM(model=MODEL_NAME, system_prompt=SYSTEM_PROMPT)
    syris.run_chat_loop()

# Only run the model if the main.py file is launched, not if it is borrowed from other files
if __name__ == "__main__":
    main()