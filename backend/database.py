from typing import Generator
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlmodel import SQLModel


# On Vercel serverless, use /tmp for writable storage
_DEFAULT_DB = "sqlite:////tmp/app.db" if os.getenv("VERCEL") else "sqlite:///./app.db"
DATABASE_URL = os.getenv("DATABASE_URL", _DEFAULT_DB)

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False,
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        pool_recycle=3600,
        connect_args={
            "connect_timeout": 60,
            "options": "-c timezone=utc",
            "application_name": "autoagent_app",
        },
        echo=False,
        pool_timeout=30,
    )

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db() -> None:
    try:
        SQLModel.metadata.create_all(bind=engine)
        print("Database tables created successfully")
    except Exception as e:
        print(f"Error creating database tables: {e}")
        raise
