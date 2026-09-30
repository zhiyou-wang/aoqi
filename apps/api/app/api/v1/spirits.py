"""精灵域路由。

展示「一个域」的标准结构：路由只做参数解析与调用 service，
业务逻辑都在 service 层。新增域时复制此模式即可。
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import PageMeta, ok
from app.services import spirit_service

router = APIRouter(prefix="/spirits", tags=["spirits"])


@router.get("")
def list_spirits(
    q: Optional[str] = Query(None, description="名字模糊搜索"),
    rarity: Optional[int] = Query(None, description="稀有度代码"),
    job: Optional[int] = Query(None, description="职业 ID"),
    position: Optional[str] = Query(None, description="站位代码"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """精灵列表：分页 + 多维筛选。"""
    items, total = spirit_service.list_spirits(
        db, q=q, rarity=rarity, job=job, position=position, page=page, size=size
    )
    pages = (total + size - 1) // size if total else 0
    return ok(
        data=[i.model_dump() for i in items],
        meta=PageMeta(total=total, page=page, size=size, pages=pages),
    )


@router.get("/filters")
def filters(db: Session = Depends(get_db)):
    """筛选项字典：从数据库字典表动态返回。"""
    return ok(data=spirit_service.get_filters(db).model_dump())
