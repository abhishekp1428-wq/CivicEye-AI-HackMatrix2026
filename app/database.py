import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

# SQLite keeps a fresh local checkout runnable without requiring a MySQL server.
# Set DATABASE_URL in .env to use MySQL or another SQLAlchemy database instead.
database_url = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{Path(__file__).resolve().parents[1] / 'civiceye.db'}",
)

connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
engine = create_engine(database_url, pool_pre_ping=True, connect_args=connect_args)
Sessionlocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)
base = declarative_base()


def get_db():
    db = Sessionlocal()
    try:
        yield db
    finally:
        db.close()
