from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = Field(default="sqlite+pysqlite:///:memory:", alias="DATABASE_URL")
    log_level: str = Field(default="INFO", alias="UKMPPR_LOG_LEVEL")

    class Config:
        extra = "ignore"


settings = Settings()
