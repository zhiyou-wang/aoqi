"""关系图域路由。"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import ok
from app.services import relation_service

router = APIRouter(prefix="/relations", tags=["relations"])


@router.get("")
def relations(db: Session = Depends(get_db)):
    """关系图总览：关系组 + 连线。"""
    return ok(data=relation_service.get_relations(db).model_dump())
