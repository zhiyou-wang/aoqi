"""皮肤域路由。"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import PageMeta, ok
from app.services import skin_service

router = APIRouter(prefix="/skins", tags=["skins"])


@router.get("")
def list_skins(
    grade: Optional[str] = Query(None, description="品级代码"),
    q: Optional[str] = Query(None, description="名字模糊搜索"),
    page: int = Query(1, ge=1),
    size: int = Query(24, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """皮肤列表：分页 + 品级筛选。"""
    items, total = skin_service.list_skins(db, grade=grade, q=q, page=page, size=size)
    pages = (total + size - 1) // size if total else 0
    return ok(
        data=[i.model_dump() for i in items],
        meta=PageMeta(total=total, page=page, size=size, pages=pages),
    )


@router.get("/grades")
def grades(db: Session = Depends(get_db)):
    """皮肤品级字典。"""
    return ok(data=[g.model_dump() for g in skin_service.get_skin_grades(db)])
