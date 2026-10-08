"""关系图域 Pydantic 契约模型。"""
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class RelationGroup(BaseModel):
    """关系组（火之试炼等）。"""

    group_id: int
    group_name: str
    tag_name: Optional[str] = None
    members: List[dict] = Field(default_factory=list)


class RelationLine(BaseModel):
    """关系连线。"""

    line_id: int
    from_race_id: int
    from_name: Optional[str] = None
    to_race_id: int
    to_name: Optional[str] = None
    label_out: Optional[str] = None
    label_back: Optional[str] = None


class RelationOverview(BaseModel):
    """关系图总览（组 + 连线）。"""

    groups: List[RelationGroup] = Field(default_factory=list)
    lines: List[RelationLine] = Field(default_factory=list)
