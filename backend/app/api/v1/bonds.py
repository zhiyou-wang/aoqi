"""羁绊域路由。"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import ok
from app.services import bond_service

router = APIRouter(prefix="/bonds", tags=["bonds"])


@router.get("")
def bonds(db: Session = Depends(get_db)):
    """羁绊总览：上阵羁绊 + 收集羁绊。"""
    return ok(data=bond_service.get_bonds(db).model_dump())
