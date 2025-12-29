from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine

from ukmppr.settings import settings


def get_engine() -> Engine:
    return create_engine(settings.database_url, pool_pre_ping=True)
