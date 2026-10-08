"""进化与羁绊 ORM 模型。"""
from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Evolution(Base):
    """进化关系。"""

    __tablename__ = "aoqi_evolution"

    from_race_id: Mapped[int] = mapped_column(Integer, ForeignKey("aoqi_spirit.race_id"), primary_key=True)
    to_race_id: Mapped[int] = mapped_column(Integer, ForeignKey("aoqi_spirit.race_id"), primary_key=True)
    step_code: Mapped[str] = mapped_column(String(20), primary_key=True)


class BondForm(Base):
    """上阵羁绊（主）。"""

    __tablename__ = "aoqi_bond_form"

    race_id: Mapped[int] = mapped_column(Integer, ForeignKey("aoqi_spirit.race_id"), primary_key=True)
    bond_name: Mapped[str | None] = mapped_column(String(100))
    effect_desc: Mapped[str | None] = mapped_column(String(500))
    awaken_level: Mapped[int | None] = mapped_column(Integer)
    power_factor: Mapped[int | None] = mapped_column(Integer)


class BondFormMember(Base):
    """上阵羁绊成员。"""

    __tablename__ = "aoqi_bond_form_member"

    race_id: Mapped[int] = mapped_column(Integer, ForeignKey("aoqi_bond_form.race_id"), primary_key=True)
    sort_no: Mapped[int] = mapped_column(Integer, primary_key=True)
    member_race_id: Mapped[int | None] = mapped_column(Integer)


class BondCollect(Base):
    """收集羁绊（深藏身名等）。"""

    __tablename__ = "aoqi_bond_collect"

    bond_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    race_id: Mapped[int] = mapped_column(Integer, ForeignKey("aoqi_spirit.race_id"))
    bond_name: Mapped[str | None] = mapped_column(String(100))
    partner_race_id: Mapped[int | None] = mapped_column(Integer)
    stat_text: Mapped[str | None] = mapped_column(String(50))
    bonus_percent: Mapped[int | None] = mapped_column(Integer)
    effect_desc: Mapped[str | None] = mapped_column(String(500))
