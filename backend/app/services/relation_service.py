"""关系图域业务逻辑。"""
from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.schemas.relation import RelationGroup, RelationLine, RelationOverview


def get_relations(db: Session) -> RelationOverview:
    """关系图总览：关系组（含成员）+ 连线。"""
    # 关系组
    group_rows = db.execute(
        text("SELECT group_id, group_name, tag_name FROM aoqi_relation_group ORDER BY group_id")
    ).mappings().all()

    groups: list[RelationGroup] = []
    for row in group_rows:
        members = db.execute(
            text(
                "SELECT gm.sort_no, gm.race_id, sp.spirit_name "
                "FROM aoqi_relation_group_member gm "
                "JOIN aoqi_spirit sp ON gm.race_id = sp.race_id "
                "WHERE gm.group_id = :group_id ORDER BY gm.sort_no"
            ),
            {"group_id": row["group_id"]},
        ).mappings().all()
        groups.append(RelationGroup(
            group_id=row["group_id"],
            group_name=row["group_name"],
            tag_name=row["tag_name"],
            members=[dict(m) for m in members],
        ))

    # 连线
    line_rows = db.execute(
        text(
            "SELECT rl.line_id, rl.from_race_id, fsp.spirit_name AS from_name, "
            "       rl.to_race_id, tsp.spirit_name AS to_name, rl.label_out, rl.label_back "
            "FROM aoqi_relation_line rl "
            "LEFT JOIN aoqi_spirit fsp ON rl.from_race_id = fsp.race_id "
            "LEFT JOIN aoqi_spirit tsp ON rl.to_race_id = tsp.race_id "
            "ORDER BY rl.line_id"
        )
    ).mappings().all()

    lines = [RelationLine(**dict(r)) for r in line_rows]

    return RelationOverview(groups=groups, lines=lines)
