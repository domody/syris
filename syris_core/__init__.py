from .core.llm import SyrisLLM
from .core.config import MODEL_NAME, SYSTEM_PROMPT

engine = SyrisLLM(model=MODEL_NAME, system_prompt=SYSTEM_PROMPT)