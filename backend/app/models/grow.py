"""养成域 ORM 模型。"""
from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class GrowItem(Base):
    """养成项字典。"""

    __tablename__ = "aoqi_grow_item"

    grow_item_code: Mapped[str] = mapped_column(String(20), primary_key=True)
    grow_item_name: Mapped[str] = mapped_column(String(20))
    category: Mapped[str] = mapped_column(String(10))
    sort_no: Mapped[int] = mapped_column(Integer)


class EraGrow(Base):
    """精灵类型 → 养成项映射。"""

    __tablename__ = "aoqi_era_grow"

    era_code: Mapped[str] = mapped_column(String(20), ForeignKey("aoqi_era.era_code"), primary_key=True)
    grow_item_code: Mapped[str] = mapped_column(String(20), ForeignKey("aoqi_grow_item.grow_item_code"), primary_key=True)
    sort_no: Mapped[int] = mapped_column(Integer)


class SpiritGrow(Base):
    """精灵养成实例。"""

    __tablename__ = "aoqi_spirit_grow"

    race_id: Mapped[int] = mapped_column(Integer, ForeignKey("aoqi_spirit.race_id"), primary_key=True)
    grow_item_code: Mapped[str] = mapped_column(String(20), ForeignKey("aoqi_grow_item.grow_item_code"), primary_key=True)
    grow_value: Mapped[str | None] = mapped_column(String(400))
