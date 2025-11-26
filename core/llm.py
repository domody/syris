from ollama import chat
from ollama import ChatResponse
from core.memory import Memory

class SyrisLLM:
    def __init__(self, model = "gemma3", system_prompt = ""):
        self.model = model
        self.memory = Memory()

        self.system_message = {"role": "system", "content": system_prompt}

    def ask(self, text):
        self.memory.add(role="user", content=text)

        messages = [self.system_message] + self.memory.get_context()

        response: ChatResponse = chat(model=self.model, messages=messages)
        reply = response['message']['content']

        self.memory.add("assistant", reply)

        return reply
    
    def run_chat_loop(self):
        print("SYRIS online.")
        
        while True:
            user = input("You: ")
            if user.lower() in ["exit", "quit"]:
                print("SYRIS: Shutting down.")
                break

            print("SYRIS:", self.ask(user))