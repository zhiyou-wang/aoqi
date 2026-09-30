"""精灵域：Pydantic 契约模型。

注意：筛选项（稀有度/职业/时代等）不在这里硬编码，
而是通过 /filters 接口从数据库字典表动态返回，保证前端筛选项
永远与数据一致——需求变化改数据即可，无需改代码。
"""
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class SpiritSummary(BaseModel):
    """精灵列表项（轻量字段，避免 946 行全字段传输）。"""

    race_id: int
    spirit_name: str
    rarity_name: Optional[str] = None
    position_name: Optional[str] = None
    jobs: List[str] = Field(default_factory=list)


class FilterOption(BaseModel):
    """单个筛选项。"""

    code: str
    name: str
    sort_no: int


class FilterDict(BaseModel):
    """筛选项字典（所有维度的并集）。"""

    rarities: List[FilterOption] = Field(default_factory=list)
    elements: List[FilterOption] = Field(default_factory=list)
    jobs: List[FilterOption] = Field(default_factory=list)
    eras: List[FilterOption] = Field(default_factory=list)
    positions: List[FilterOption] = Field(default_factory=list)
