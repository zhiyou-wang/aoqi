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
    rarity_code: Optional[int] = None
    rarity_name: Optional[str] = None
    position_name: Optional[str] = None
    jobs: List[str] = Field(default_factory=list)
    elements: List[str] = Field(default_factory=list)
    eras: List[str] = Field(default_factory=list)


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


# ---- 详情聚合 ----

class SpiritJobDetail(BaseModel):
    """精灵职业（带优先级）。"""

    job_id: int
    job_name: str
    job_desc: Optional[str] = None
    priority_no: Optional[int] = None


class SpiritSkillDetail(BaseModel):
    """精灵技能（带槽位与等级文案）。"""

    slot_code: str
    slot_name: Optional[str] = None
    skill_id: Optional[int] = None
    skill_name: Optional[str] = None
    skill_type: Optional[str] = None
    power_type: Optional[str] = None
    levels: List[dict] = Field(default_factory=list)


class SpiritSkinDetail(BaseModel):
    """精灵可穿戴皮肤。"""

    form_skin_id: int
    skin_id: int
    skin_name: Optional[str] = None
    grade_code: Optional[str] = None
    grade_name: Optional[str] = None
    is_base: Optional[str] = None


class SpiritDetail(BaseModel):
    """精灵详情（档案 + 技能 + 皮肤 + 进化 + 羁绊聚合）。"""

    race_id: int
    spirit_name: str
    rarity_code: Optional[int] = None
    rarity_name: Optional[str] = None
    position_name: Optional[str] = None
    lineage_race_id: Optional[int] = None
    book_id: Optional[str] = None
    # 档案
    gender_code: Optional[str] = None
    birthday_text: Optional[str] = None
    height_text: Optional[str] = None
    weight_text: Optional[str] = None
    hobby_text: Optional[str] = None
    character_text: Optional[str] = None
    birthplace_text: Optional[str] = None
    self_desc: Optional[str] = None
    resume_text: Optional[str] = None
    strategy_text: Optional[str] = None
    introduce_text: Optional[str] = None
    # 五维
    scores: List[int] = Field(default_factory=list)
    # 关联
    jobs: List[SpiritJobDetail] = Field(default_factory=list)
    elements: List[str] = Field(default_factory=list)
    eras: List[str] = Field(default_factory=list)
    skills: List[SpiritSkillDetail] = Field(default_factory=list)
    skins: List[SpiritSkinDetail] = Field(default_factory=list)
    evolves_from: List[int] = Field(default_factory=list)
    evolves_to: List[int] = Field(default_factory=list)
    bonds_form: List[dict] = Field(default_factory=list)
    bonds_collect: List[dict] = Field(default_factory=list)
