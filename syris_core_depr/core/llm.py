import json
from ollama import chat
from ollama import ChatResponse
from  .memory import Memory
from ..modules.tools import TOOLS, TOOL_MAP

class SyrisLLM:
    def __init__(self, model = "gpt-oss", system_prompt = ""):
        self.model = model
        self.memory = Memory()

        self.system_message = {"role": "system", "content": system_prompt}

        self.tools = TOOLS
        self.tool_map = TOOL_MAP

        self.logging = False

    def log(self, label, data):
        if not self.logging:
            return

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

    def _safe_serialize(self, obj):

        if obj is None:
            return None

        if hasattr(obj, "__dict__"):
            return {k: self._safe_serialize(v) for k, v in obj.__dict__.items()}

        if isinstance(obj, list):
            return [self._safe_serialize(v) for v in obj]

        if isinstance(obj, tuple):
            return [self._safe_serialize(v) for v in obj]

        if isinstance(obj, dict):
            return {k: self._safe_serialize(v) for k, v in obj.items()}

        return obj
 
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

        self.log("STREAM START", {"user": text})

        loop_count = 0
        MAX_LOOPS = 10

        while True:
            loop_count += 1
            if loop_count > MAX_LOOPS:
                self.log("ERROR", "Exceeded max tool-call loops (possible infinite loop)")
                yield {"type": "error", "token": "Tool loop exceeded"}
                return

            self.log("STREAM PASS START", {"messages": messages})

            stream = chat(
                model=self.model,
                messages=messages,
                tools=self.tools,
                think="low",
                stream=True,
            )

            accumulated_content = ""
            accumulated_thinking = ""
            accumulated_tool_calls = []

            done_thinking = False

            for chunk in stream:
                self.log("RAW CHUNK", chunk)

                if chunk.message.thinking:
                    piece = chunk.message.thinking
                    accumulated_thinking += piece

                    self.log("THINKING", piece)

                    yield {"type": "thinking", "token": piece}
                    continue

                if chunk.message.tool_calls:
                    accumulated_tool_calls.extend(chunk.message.tool_calls)

                    self.log("TOOL CALL", self._safe_serialize(chunk.message.tool_calls))
                    yield {"type": "tool_call", "token": self._safe_serialize(chunk.message.tool_calls)}
                    continue

                if chunk.message.content:
                    if not done_thinking:
                        done_thinking = True
                    piece = chunk.message.content
                    accumulated_content += piece

                    self.log("CONTENT", piece)

                    yield {"type": "content", "token": piece}
                    continue

            assistant_msg = {
                "role": "assistant",
                "content": accumulated_content,
                "thinking": accumulated_thinking,
                "tool_calls": self._safe_serialize(accumulated_tool_calls),
            }

            self.log("STREAM PASS DONE", assistant_msg)

            messages.append(assistant_msg)

            if not accumulated_tool_calls:
                self.log("STREAM FINAL", {"final_content": accumulated_content})
                self.memory.add("assistant", accumulated_content)
                break

            for call in accumulated_tool_calls:
                tool_name = call.function.name
                args = call.function.arguments or {}

                self.log("TOOL EXECUTE", {"name": tool_name, "args": args})

                if tool_name in self.tool_map:
                    result = self.tool_map[tool_name]["func"](**args)
                else:
                    result = f"Unknown tool: {tool_name}"

                self.log("TOOL RESULT", {"name": tool_name, "result": result})

                yield {
                    "type": "tool_result",
                    "tool_name": tool_name,
                    "token": str(result),
                }

                messages.append({
                    "role": "tool",
                    "tool_name": tool_name,
                    "content": str(result),
                })

        self.log("STREAM END", {})
        yield {"type": "end"}

    def run_chat_loop(self):
        print("SYRIS online.")
        
        while True:
            user = input("You: ")
            if user.lower() in ["exit", "quit"]:
                print("SYRIS: Shutting down.")
                break

            print("SYRIS:", self.stream(user))