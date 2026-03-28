from typing import Literal

from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from .version import VERSION


class LLMSettings(BaseModel):
    """Configuration for the LLM provider used by the responder."""

    provider: Literal["sglang", "ollama"] = "ollama"
    base_url: str = "http://localhost:11434"
    model: str = "llama3.2"
    timeout_s: int = Field(default=30, ge=1, le=300)
    system_prompt: str = (
        "You are SYRIS, an always-on automation control plane. "
        "Respond concisely and accurately."
    )


class Settings(BaseSettings):
    """
        v3.0.x settings:
        - env + version/service metadata
        - db url
        - heartbeat interval
    """

    model_config = SettingsConfigDict(
        env_prefix="SYRIS_",
        env_file=".env",
        extra="ignore"
    )

    env: Literal["dev", "test", "prod"] = "dev"

    service_name: str = "syris-core"
    version: str = VERSION

    api_host: str = "0.0.0.0"
    api_port: int = 8000

    database_url: str = "postgresql+asyncpg://syris:syris@localhost:5432/syris"
    
    heartbeat_interval_s: int = Field(default=30, ge=1, le=3600)

    log_level: str = "INFO"

    llm: LLMSettings = Field(default_factory=LLMSettings)