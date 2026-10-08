"""皮肤域 Pydantic 契约模型。"""
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class SkinGrade(BaseModel):
    """皮肤品级。"""

    grade_code: str
    grade_name: str
    sort_no: int


class SkinSummary(BaseModel):
    """皮肤列表项。"""

    skin_id: int
    skin_name: str
    grade_code: Optional[str] = None
    grade_name: Optional[str] = None
    # 可被多少个形态穿戴
    wear_count: int = 0


class SkinDetail(BaseModel):
    """皮肤详情（含穿戴关系）。"""

    skin_id: int
    skin_name: str
    grade_code: Optional[str] = None
    grade_name: Optional[str] = None
    # 穿戴关系：哪个形态（race_id + 精灵名）能穿这件皮肤
    wearers: List[dict] = Field(default_factory=list)


class SkinListQuery(BaseModel):
    """皮肤列表查询参数。"""

    grade: Optional[str] = None
    q: Optional[str] = None
    page: int = 1
    size: int = 24
