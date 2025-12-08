from ollama import chat, ChatResponse
from syris_core.memory.working_memory import WorkingMemory
from syris_core.util.logger import log

class LLMProvider:
    def __init__(self, working_memory: WorkingMemory, model_name: str = "gpt-oss"):
        self.model_name = model_name

        self.working_memory = working_memory
    
    async def complete(self, prompt:str, system_prompt: str) -> str:
        messages = [
                {"role": "system", "content": system_prompt},
                *self.working_memory.get_context(),
                {"role": "user", "content": prompt}
            ]
        
        # log("memory", f"[WorkingMemory] Previous Messages: {[*self.working_memory.get_context(), {"role": "user", "content": prompt}]}")

        response: ChatResponse = chat(model=self.model_name, messages=messages, think='low')
        reply = response['message']['content']

        return reply

