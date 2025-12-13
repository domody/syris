import json

from syris_core.llm.provider import LLMProvider
from syris_core.types.llm import Intent, Plan
from syris_core.util.logger import  log

class Planner:
    def __init__(self, provider: LLMProvider, system_prompt: str):
        self.provider = provider
        self.system_prompt = system_prompt

    async def generate(self) -> Plan:
        log("llm", f"[Planner] Generating plan...")

        response = await self.provider.complete(system_prompt=self.system_prompt, format=Plan.model_json_schema(), think="medium")
        raw: str = response["message"]["content"]

        try:
            data = json.loads(raw)
        except:
            log("error", f"[Planner] Failed to parse Plan JSON: {raw}")
            return Plan(name = None, steps = [])
        
        try: 
            plan = Plan(**data)
            log("llm", f"[Planner] Plan generated: {plan}")
            return plan
    
        except Exception as e:
            log("error", f"[Planner] Invalid Plan shape: {data}")
            log("error", str(e))
            return Plan(name = None, steps = [])