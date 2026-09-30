"""皮肤域 ORM 模型。"""
from __future__ import annotations

from sqlalchemy import CHAR, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class SkinGrade(Base):
    """皮肤品级字典。"""

    __tablename__ = "aoqi_skin_grade"

    grade_code: Mapped[str] = mapped_column(String(20), primary_key=True)
    grade_name: Mapped[str] = mapped_column(String(20))
    sort_no: Mapped[int] = mapped_column(Integer)


class Skin(Base):
    """皮肤本体（一件皮肤可被多个形态穿戴）。"""

    __tablename__ = "aoqi_skin"

    skin_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    skin_name: Mapped[str] = mapped_column(String(200))
    grade_code: Mapped[str | None] = mapped_column(String(20), ForeignKey("aoqi_skin_grade.grade_code"))


class SpiritSkin(Base):
    """形态-皮肤穿戴关系（多对多）。

    form_skin_id 是客户端给「该形态的皮肤」的唯一编号，
    skin_id 指向皮肤本体，race_id 指向穿戴形态。
    """

    __tablename__ = "aoqi_spirit_skin"

    form_skin_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    skin_id: Mapped[int] = mapped_column(Integer, ForeignKey("aoqi_skin.skin_id"))
    race_id: Mapped[int] = mapped_column(Integer, ForeignKey("aoqi_spirit.race_id"))
    element_code: Mapped[str | None] = mapped_column(String(8))
    is_base: Mapped[str | None] = mapped_column(CHAR(1))
