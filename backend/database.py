"""
Database engine and session management.

The engine is created lazily so importing this module does not require
DATABASE_URL to be set yet (env is loaded by the app/script entry points).
Schema is owned by Alembic migrations — this module never calls create_all.
"""

import os
from typing import Iterator, Optional

from sqlmodel import Session, create_engine
from sqlalchemy.engine import Engine

_engine: Optional[Engine] = None


def _database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL is not set.")
    return url


def get_engine() -> Engine:
    """Return the process-wide SQLAlchemy engine, creating it on first use."""
    global _engine
    if _engine is None:
        _engine = create_engine(_database_url(), pool_pre_ping=True)
    return _engine


def get_session() -> Iterator[Session]:
    """FastAPI dependency that yields a database session."""
    with Session(get_engine()) as session:
        yield session
