from __future__ import annotations

import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "dev"
    log_level: str = "INFO"

    # Railway provides DATABASE_URL, we also accept our own format
    database_url: str = ""

    reddit_user_agent: str = "ukmppr/0.1 (contact: you@example.com)"

    bronze_dir: Path = Path("data/bronze")

    # LLM Settings
    llm_provider: str = "groq"  # "groq" or "ollama"
    groq_api_key: str = ""  # Get free key at console.groq.com
    groq_model: str = "llama-3.3-70b-versatile"  # Free tier model
    ollama_model: str = "llama3.2:1b"  # Local fallback

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Handle Railway's DATABASE_URL or fallback to local
        if not self.database_url:
            self.database_url = os.environ.get(
                "DATABASE_URL", "postgresql+psycopg://ukmppr:ukmppr@localhost:5432/ukmppr"
            )
        # Railway uses postgres:// but SQLAlchemy needs postgresql://
        if self.database_url.startswith("postgres://"):
            self.database_url = self.database_url.replace("postgres://", "postgresql+psycopg://", 1)
        elif self.database_url.startswith("postgresql://") and "+psycopg" not in self.database_url:
            self.database_url = self.database_url.replace(
                "postgresql://", "postgresql+psycopg://", 1
            )


settings = Settings()
