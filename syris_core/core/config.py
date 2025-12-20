from pydantic import BaseModel
from pathlib import Path

PROMPTS_DIR = Path(__file__).resolve().parents[1] / "llm" / "prompts"


class OrchestratorConfig(BaseModel):
    model_name: str = "gpt-oss"
    tz_name: str = "Europe/London"
    prompts_dir: Path = PROMPTS_DIR
    max_concurrent_events: int = 32

    intent_prompt_file: str = "intent.txt"
    planning_prompt_file: str = "planning.txt"
    system_prompt_file: str = "system.txt"
