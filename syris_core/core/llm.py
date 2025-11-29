import json
import asyncio
from ollama import chat
from ollama import ChatResponse
from  .memory import Memory

from ..modules.tools import TOOLS, TOOL_MAP

class SyrisLLM:
    def __init__(self, model = "gemma3", system_prompt = ""):
        self.model = model
        self.memory = Memory()

        self.system_message = {"role": "system", "content": system_prompt}

        self.tools = TOOLS
        self.tool_map = TOOL_MAP

        self.logging = False

    def log(self, label, data):
        if not self.logging:
            return  # early exit

        try:
            if hasattr(data, "model_dump"):
                data = data.model_dump()

            print(f"\n--- {label} ---")
            print(json.dumps(data, indent=2))
            print("--- END ---\n")

        except Exception as e:
            print(f"\n--- LOGGING ERROR [{label}] ---")
            print(str(e))
            print("--- END ---\n")

    def ask(self, text):
        self.memory.add(role="user", content=text)

        messages = [self.system_message] + self.memory.get_context()

        response: ChatResponse = chat(model=self.model, messages=messages, tools=self.tools, think='low')
        self.log("RAW RESPONSE", response)
        reply = response['message']['content']
        
        if response.message.tool_calls:
            self.log("TOOL CALL", response.message.tool_calls)
            call = response.message.tool_calls[0]

            tool_name = call.function.name
            args = call.function.arguments or {}

            if tool_name in self.tool_map:
                result = self.tool_map[tool_name](**args)
            else:
                result = f"Unknown tool: {tool_name}"

            tool_message = {
                "role": "tool",
                "tool_name": tool_name,
                "content": str(result),
            }
            self.log("TOOL RESULT", {"name": tool_name, "result": result})
            final_messages = messages + [tool_message]

            final_response: ChatResponse = chat(
                model=self.model,
                messages=final_messages,
                tools=self.tools,
                think="low"
            )
            self.log("FINAL RESPONSE", final_response)

            final_reply = final_response.message.content

            self.memory.add("assistant", final_reply)
            return final_reply

        self.memory.add("assistant", reply)

        return reply
    
    async def stream(self, text: str):
        self.memory.add(role="user", content=text)

        messages = [self.system_message] + self.memory.get_context()

        stream = chat(
            model=self.model,
            messages=messages,
            tools=self.tools,
            think="low",
            stream=True,
        )

        full_reply = ""

        for chunk in stream:
            token = chunk["message"]["content"]
            full_reply += token
            yield token
            await asyncio.sleep(0)  # yield control

        self.memory.add("assistant", full_reply)
        
    def run_chat_loop(self):
        print("SYRIS online.")
        
        while True:
            user = input("You: ")
            if user.lower() in ["exit", "quit"]:
                print("SYRIS: Shutting down.")
                break

            print("SYRIS:", self.ask(user))