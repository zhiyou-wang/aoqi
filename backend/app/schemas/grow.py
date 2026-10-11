"""养成域 Pydantic 契约模型。"""
from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field


class GrowItem(BaseModel):
    """养成项。"""

    grow_item_code: str
    grow_item_name: str
    category: str
    sort_no: int


class EraGrowItem(BaseModel):
    """某精灵类型的一个养成项（含名称，供前端直接展示）。"""

    grow_item_code: str
    grow_item_name: str
    sort_no: int


class GrowConfig(BaseModel):
    """养成配置总览：字典 + 各类型映射。"""

    items: List[GrowItem] = Field(default_factory=list)
    # era_code → 养成项列表
    era_map: dict = Field(default_factory=dict)
