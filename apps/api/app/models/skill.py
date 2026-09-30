"""技能域 ORM 模型。"""
from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class SkillSlot(Base):
    """技能槽位字典。"""

    __tablename__ = "aoqi_skill_slot"

    slot_code: Mapped[str] = mapped_column(String(20), primary_key=True)
    slot_name: Mapped[str] = mapped_column(String(20))
    sort_no: Mapped[int] = mapped_column(Integer)


class Skill(Base):
    """技能主表。"""

    __tablename__ = "aoqi_skill"

    skill_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    skill_name: Mapped[str] = mapped_column(String(100))
    skill_type: Mapped[str | None] = mapped_column(String(20))
    power_type: Mapped[str | None] = mapped_column(String(20))
    target_type: Mapped[str | None] = mapped_column(String(20))


class SkillLevel(Base):
    """技能等级文案。"""

    __tablename__ = "aoqi_skill_level"

    skill_id: Mapped[int] = mapped_column(Integer, ForeignKey("aoqi_skill.skill_id"), primary_key=True)
    skill_level: Mapped[int] = mapped_column(Integer, primary_key=True)
    level_skill_id: Mapped[int | None] = mapped_column(Integer)
    skill_desc: Mapped[str | None] = mapped_column(String(4000))


class SpiritSkill(Base):
    """精灵-技能关联。"""

    __tablename__ = "aoqi_spirit_skill"

    race_id: Mapped[int] = mapped_column(Integer, ForeignKey("aoqi_spirit.race_id"), primary_key=True)
    slot_code: Mapped[str] = mapped_column(String(20), ForeignKey("aoqi_skill_slot.slot_code"), primary_key=True)
    skill_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("aoqi_skill.skill_id"))
