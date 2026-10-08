"""养成域路由。"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import ok
from app.services import grow_service

router = APIRouter(prefix="/grow", tags=["grow"])


@router.get("/config")
def grow_config(db: Session = Depends(get_db)):
    """养成配置：字典 + 各类型映射。"""
    return ok(data=grow_service.get_grow_config(db).model_dump())


@router.get("/{race_id}")
def spirit_grow(race_id: int, db: Session = Depends(get_db)):
    """某精灵的养成数据。"""
    return ok(data=[g.model_dump() for g in grow_service.get_spirit_grow(db, race_id)])
