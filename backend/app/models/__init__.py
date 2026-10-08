"""SQLAlchemy ORM 模型（映射 AOQI_* 表）。

按域拆分，全部从本包导出，供服务层 import。
新增域时：新建 xxx.py，在这里导出。
"""
from app.models.base import Base
from app.models.bond import BondCollect, BondForm, BondFormMember, Evolution
from app.models.grow import EraGrow, GrowItem, SpiritGrow
from app.models.skill import Skill, SkillLevel, SkillSlot, SpiritSkill
from app.models.skin import Skin, SkinGrade, SpiritSkin
from app.models.spirit import (
    Element,
    Era,
    Job,
    Position,
    Rarity,
    Spirit,
    SpiritElement,
    SpiritEra,
    SpiritJob,
)

__all__ = [
    "Base",
    # spirit
    "Spirit", "Rarity", "Element", "Era", "Position", "Job",
    "SpiritJob", "SpiritElement", "SpiritEra",
    # skill
    "Skill", "SkillLevel", "SkillSlot", "SpiritSkill",
    # skin
    "Skin", "SkinGrade", "SpiritSkin",
    # bond & evolution
    "Evolution", "BondForm", "BondFormMember", "BondCollect",
    # grow
    "GrowItem", "EraGrow", "SpiritGrow",
]
