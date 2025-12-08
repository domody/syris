from ollama import chat, ChatResponse
from syris_core.util.logger import log

class LLMProvider:
    def __init__(self, model_name: str = "gpt-oss"):
        self.model_name = model_name

        self.memory = []
    
    async def complete(self, prompt:str, system_prompt: str) -> str:
        messages = [{"role": "system", "content": system_prompt}] + [{"role": "user", "content": prompt}]

        response: ChatResponse = chat(model=self.model_name, messages=messages, think='low')
        reply = response['message']['content']

        return reply

