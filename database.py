"""
database.py - Database connection and session management
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_ih8a7QpXwEPI@ep-plain-frost-aoydwm56.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,       # Check connection health before using
    pool_size=10,              # Connection pool size
    max_overflow=20,           # Extra connections allowed
    echo=False                 # Set True for SQL query logging in dev
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependency to get DB session, auto-closes after request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
