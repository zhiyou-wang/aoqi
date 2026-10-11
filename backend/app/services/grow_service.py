"""养成域业务逻辑。"""
from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.schemas.grow import EraGrowItem, GrowConfig, GrowItem


def get_grow_config(db: Session) -> GrowConfig:
    """养成配置：字典 + 各类型映射。"""
    # 字典
    item_rows = db.execute(
        text("SELECT grow_item_code, grow_item_name, category, sort_no FROM aoqi_grow_item ORDER BY category, sort_no")
    ).mappings().all()
    items = [GrowItem(**dict(r)) for r in item_rows]

    # 各类型映射
    era_rows = db.execute(
        text(
            "SELECT eg.era_code, gi.grow_item_code, gi.grow_item_name, eg.sort_no "
            "FROM aoqi_era_grow eg "
            "JOIN aoqi_grow_item gi ON eg.grow_item_code = gi.grow_item_code "
            "ORDER BY eg.era_code, eg.sort_no"
        )
    ).mappings().all()

    era_map: dict[str, list] = {}
    for r in era_rows:
        era_map.setdefault(r["era_code"], []).append(
            EraGrowItem(
                grow_item_code=r["grow_item_code"],
                grow_item_name=r["grow_item_name"],
                sort_no=r["sort_no"],
            )
        )

    return GrowConfig(items=items, era_map=era_map)
