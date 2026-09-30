"""材质配置路由：稀有度/品级 → 材质参数。"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import ok
from app.services import material_service

router = APIRouter(tags=["material"])


@router.get("/material-config")
def material_config(db: Session = Depends(get_db)):
    """材质阶梯配置：稀有度/皮肤品级 → 材质参数。"""
    return ok(data=material_service.get_material_config(db).model_dump())
