"""SQLAlchemy 声明式基类。

所有 ORM 模型继承 Base。表名与 Oracle 中 AOQI_* 一致，
通过 schema 参数指定属主（默认 SCOTT）。
"""
from __future__ import annotations

from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    """声明式基类。"""

    # 统一 schema（Oracle 属主）
    __table_args__ = {"schema": settings.db_schema}
