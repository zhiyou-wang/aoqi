"""数据库会话管理：Oracle 连接池。

使用 oracledb 连接池 + SQLAlchemy，避免每请求新建连接。
连接参数从 config.settings 读取。
"""
from __future__ import annotations

import oracledb
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# oracledb 连接池：供底层驱动复用物理连接
_pool = oracledb.create_pool(
    user=settings.db_user,
    password=settings.db_password,
    dsn=settings.db_dsn,
    min=settings.db_pool_min,
    max=settings.db_pool_max,
    increment=settings.db_pool_increment,
)

# SQLAlchemy engine：走上面的连接池
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    connect_args={"pool": _pool},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    """FastAPI 依赖：请求级会话，用完关闭。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
