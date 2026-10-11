"""皮肤域 Pydantic 契约模型。"""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


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


class SkinListQuery(BaseModel):
    """皮肤列表查询参数。"""

    grade: Optional[str] = None
    q: Optional[str] = None
    page: int = 1
    size: int = 24
