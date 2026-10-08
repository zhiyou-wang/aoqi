"""羁绊域 Pydantic 契约模型。"""
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class BondForm(BaseModel):
    """上阵羁绊。"""

    race_id: int
    spirit_name: Optional[str] = None
    bond_name: Optional[str] = None
    effect_desc: Optional[str] = None
    awaken_level: Optional[int] = None
    power_factor: Optional[float] = None
    members: List[dict] = Field(default_factory=list)


class BondCollect(BaseModel):
    """收集羁绊（深藏身名等）。"""

    bond_id: int
    spirit_name: Optional[str] = None
    partner_name: Optional[str] = None
    bond_name: Optional[str] = None
    stat_text: Optional[str] = None
    bonus_percent: Optional[int] = None
    effect_desc: Optional[str] = None


class BondOverview(BaseModel):
    """羁绊总览（上阵 + 收集）。"""

    forms: List[BondForm] = Field(default_factory=list)
    collects: List[BondCollect] = Field(default_factory=list)
