"""精灵域 ORM 模型：精灵 + 字典表 + 关联表。

映射 Oracle 中的 AOQI_SPIRIT / AOQI_RARITY / AOQI_JOB 等表。
字段名与数据库列名一致，查询时无需额外映射。
"""
from __future__ import annotations

from sqlalchemy import CHAR, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Rarity(Base):
    """稀有度字典。"""

    __tablename__ = "aoqi_rarity"

    rarity_code: Mapped[int] = mapped_column(Integer, primary_key=True)
    rarity_name: Mapped[str] = mapped_column(String(20))
    sort_no: Mapped[int] = mapped_column(Integer)
    list_filter: Mapped[str] = mapped_column(CHAR(1))


class Element(Base):
    """元素字典。"""

    __tablename__ = "aoqi_element"

    element_code: Mapped[str] = mapped_column(String(8), primary_key=True)
    sort_no: Mapped[int] = mapped_column(Integer)


class Era(Base):
    """时代字典。"""

    __tablename__ = "aoqi_era"

    era_code: Mapped[str] = mapped_column(String(20), primary_key=True)
    era_name: Mapped[str] = mapped_column(String(20))
    sort_no: Mapped[int] = mapped_column(Integer)


class Position(Base):
    """站位字典。"""

    __tablename__ = "aoqi_position"

    position_code: Mapped[str] = mapped_column(String(20), primary_key=True)
    position_name: Mapped[str] = mapped_column(String(20))
    sort_no: Mapped[int] = mapped_column(Integer)


class Job(Base):
    """职业字典。"""

    __tablename__ = "aoqi_job"

    job_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    job_name: Mapped[str] = mapped_column(String(40))
    job_desc: Mapped[str] = mapped_column(String(400))
    attack_type: Mapped[int] = mapped_column(Integer)
    sort_no: Mapped[int] = mapped_column(Integer)


class Spirit(Base):
    """精灵主表。"""

    __tablename__ = "aoqi_spirit"

    race_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    spirit_name: Mapped[str] = mapped_column(String(200))
    rarity_code: Mapped[int | None] = mapped_column(Integer, ForeignKey("aoqi_rarity.rarity_code"))
    position_code: Mapped[str | None] = mapped_column(String(20), ForeignKey("aoqi_position.position_code"))
    lineage_race_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("aoqi_spirit.race_id"))
    book_id: Mapped[str | None] = mapped_column(String(20))
    gender_code: Mapped[str | None] = mapped_column(CHAR(1))
    birthday_text: Mapped[str | None] = mapped_column(String(20))
    height_text: Mapped[str | None] = mapped_column(String(20))
    weight_text: Mapped[str | None] = mapped_column(String(20))
    hobby_text: Mapped[str | None] = mapped_column(String(200))
    character_text: Mapped[str | None] = mapped_column(String(200))
    birthplace_text: Mapped[str | None] = mapped_column(String(100))
    self_desc: Mapped[str | None] = mapped_column(String(500))
    resume_text: Mapped[str | None] = mapped_column(String(200))
    strategy_text: Mapped[str | None] = mapped_column(String(500))
    introduce_text: Mapped[str | None] = mapped_column(String(4000))
    hp_score: Mapped[int | None] = mapped_column(Integer)
    atk_score: Mapped[int | None] = mapped_column(Integer)
    pdef_score: Mapped[int | None] = mapped_column(Integer)
    mdef_score: Mapped[int | None] = mapped_column(Integer)
    spd_score: Mapped[int | None] = mapped_column(Integer)


class SpiritJob(Base):
    """精灵-职业关联（多对多，带优先级）。"""

    __tablename__ = "aoqi_spirit_job"

    race_id: Mapped[int] = mapped_column(Integer, ForeignKey("aoqi_spirit.race_id"), primary_key=True)
    job_id: Mapped[int] = mapped_column(Integer, ForeignKey("aoqi_job.job_id"), primary_key=True)
    priority_no: Mapped[int | None] = mapped_column(Integer)


class SpiritElement(Base):
    """精灵-元素关联。"""

    __tablename__ = "aoqi_spirit_element"

    race_id: Mapped[int] = mapped_column(Integer, ForeignKey("aoqi_spirit.race_id"), primary_key=True)
    element_code: Mapped[str] = mapped_column(String(8), ForeignKey("aoqi_element.element_code"), primary_key=True)


class SpiritEra(Base):
    """精灵-时代关联。"""

    __tablename__ = "aoqi_spirit_era"

    race_id: Mapped[int] = mapped_column(Integer, ForeignKey("aoqi_spirit.race_id"), primary_key=True)
    era_code: Mapped[str] = mapped_column(String(20), ForeignKey("aoqi_era.era_code"), primary_key=True)
