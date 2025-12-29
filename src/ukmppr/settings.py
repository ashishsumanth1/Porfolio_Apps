from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "dev"
    log_level: str = "INFO"

    database_url: str = "postgresql+psycopg://ukmppr:ukmppr@localhost:5432/ukmppr"

    reddit_user_agent: str = "ukmppr/0.1 (contact: you@example.com)"

    bronze_dir: Path = Path("data/bronze")

    # LLM Settings
    llm_provider: str = "groq"  # "groq" or "ollama"
    groq_api_key: str = ""  # Get free key at console.groq.com
    groq_model: str = "llama-3.3-70b-versatile"  # Free tier model
    ollama_model: str = "llama3.2:1b"  # Local fallback


settings = Settings()
