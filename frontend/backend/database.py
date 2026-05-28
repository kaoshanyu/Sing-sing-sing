from typing import Generator
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlmodel import SQLModel

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://autoagent:mind_autoagent@localhost:5432/postgres"
)
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
    expire_on_commit=False
)
def get_db() -> Generator[Session, None, None]:
    """
    数据库依赖注入函数，用于 FastAPI。
    使用方式: Depends(get_db)
    示例:
        @app.get("/items/")
        def read_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
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
    """
    初始化数据库，创建所有表。
    在 FastAPI 启动时调用此函数。
    示例:
        @app.on_event("startup")
        async def startup():
            init_db()
    """
    try:
        SQLModel.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
        raise