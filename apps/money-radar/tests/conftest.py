"""
Test configuration and fixtures for ukmppr tests.
"""
from pathlib import Path
import sys
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from ukmppr.schema import init_db
from ukmppr.trends import compute_weekly_trends

PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = PROJECT_ROOT / "api"
for path in (SOURCE_ROOT, PROJECT_ROOT):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))
sys.modules.pop("api", None)


@pytest.fixture(scope="session")
def test_database_url():
    """Get test database URL from environment or use default."""
    return os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://ukmppr:ukmppr@localhost:5432/ukmppr_test"
    )


@pytest.fixture(scope="session")
def engine(test_database_url):
    """Create test database engine."""
    engine = create_engine(test_database_url)
    init_db(engine)
    compute_weekly_trends(engine=engine, lookback_weeks=1)
    return engine


@pytest.fixture(scope="function")
def db_session(engine):
    """Create a new database session for each test."""
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.rollback()
        session.close()
