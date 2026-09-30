"""健康检查：验证服务与数据库连通性。"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import ok

router = APIRouter(tags=["health"])


@router.get("/health")
def health(db: Session = Depends(get_db)):
    """返回服务与数据库状态。"""
    db_status = "up"
    try:
        db.execute(text("SELECT 1 FROM DUAL"))
    except Exception:
        db_status = "down"
    return ok(data={"status": "ok", "database": db_status})
