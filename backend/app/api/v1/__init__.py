"""API v1 路由汇总：注册所有域的 router。

新增域时：在这里 import 并 include，一处注册即可。
"""
from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import bonds, grow, health, relations, skins, spirits

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(spirits.router)
api_router.include_router(skins.router)
api_router.include_router(bonds.router)
api_router.include_router(relations.router)
api_router.include_router(grow.router)
