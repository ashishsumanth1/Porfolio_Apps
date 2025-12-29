"""
Test configuration and fixtures for ukmppr tests.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os


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
    return create_engine(test_database_url)


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
