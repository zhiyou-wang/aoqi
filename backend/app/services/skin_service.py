"""皮肤域业务逻辑。"""
from __future__ import annotations

from typing import List, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.schemas.skin import SkinGrade, SkinSummary


def list_skins(
    db: Session,
    *,
    grade: Optional[str] = None,
    q: Optional[str] = None,
    page: int = 1,
    size: int = 24,
) -> tuple[List[SkinSummary], int]:
    """分页查询皮肤列表（含穿戴形态数）。"""
    where: List[str] = []
    params: dict = {}

    if grade:
        where.append("sk.grade_code = :grade")
        params["grade"] = grade
    if q:
        where.append("sk.skin_name LIKE :q")
        params["q"] = f"%{q}%"

    where_sql = (" WHERE " + " AND ".join(where)) if where else ""

    total = db.execute(
        text(f"SELECT COUNT(*) FROM aoqi_skin sk{where_sql}"),
        params,
    ).scalar_one()

    offset = (page - 1) * size
    rows = db.execute(
        text(
            "SELECT sk.skin_id, sk.skin_name, sk.grade_code, sg.grade_name, "
            "       (SELECT COUNT(*) FROM aoqi_spirit_skin ss WHERE ss.skin_id = sk.skin_id) AS wear_count "
            "FROM aoqi_skin sk "
            "LEFT JOIN aoqi_skin_grade sg ON sk.grade_code = sg.grade_code"
            f"{where_sql} "
            "ORDER BY sk.skin_id "
            f"OFFSET {offset} ROWS FETCH NEXT {size} ROWS ONLY"
        ),
        params,
    ).mappings().all()

    items = [
        SkinSummary(
            skin_id=row["skin_id"],
            skin_name=row["skin_name"],
            grade_code=row["grade_code"],
            grade_name=row["grade_name"],
            wear_count=row["wear_count"],
        )
        for row in rows
    ]
    return items, total


def get_skin_grades(db: Session) -> List[SkinGrade]:
    """皮肤品级字典。"""
    rows = db.execute(
        text("SELECT grade_code, grade_name, sort_no FROM aoqi_skin_grade ORDER BY sort_no")
    ).mappings().all()
    return [SkinGrade(**dict(r)) for r in rows]
