"""精灵域业务逻辑：列表查询 + 筛选项字典。

M1 阶段用原生 SQL（SQLAlchemy text），M2 迁移到 ORM 模型后
本层接口签名保持不变，路由层无需改动——这是「业务逻辑与
数据访问解耦」的体现。

新增筛选维度时：在 list_spirits 加参数 + 在 SQL 加条件即可。
"""
from __future__ import annotations

from typing import List, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.schemas.spirit import FilterDict, FilterOption, SpiritSummary

# 列表查询：聚合职业（按优先级排序）
_LIST_SQL = """
SELECT s.race_id, s.spirit_name,
       r.rarity_name, p.position_name,
       (SELECT LISTAGG(j.job_name, ',') WITHIN GROUP (ORDER BY sj.priority_no)
          FROM aoqi_spirit_job sj
          JOIN aoqi_job j ON sj.job_id = j.job_id
         WHERE sj.race_id = s.race_id) AS jobs
  FROM aoqi_spirit s
  LEFT JOIN aoqi_rarity r   ON s.rarity_code = r.rarity_code
  LEFT JOIN aoqi_position p ON s.position_code = p.position_code
"""


def list_spirits(
    db: Session,
    *,
    q: Optional[str] = None,
    rarity: Optional[int] = None,
    job: Optional[int] = None,
    position: Optional[str] = None,
    page: int = 1,
    size: int = 20,
) -> tuple[List[SpiritSummary], int]:
    """分页 + 筛选查询精灵列表。返回 (结果, 总数)。"""
    where: List[str] = []
    params: dict = {}

    if q:
        where.append("s.spirit_name LIKE :q")
        params["q"] = f"%{q}%"
    if rarity is not None:
        where.append("s.rarity_code = :rarity")
        params["rarity"] = rarity
    if position:
        where.append("s.position_code = :position")
        params["position"] = position
    if job is not None:
        # 职业筛选需要关联表
        where.append("EXISTS (SELECT 1 FROM aoqi_spirit_job sjj WHERE sjj.race_id = s.race_id AND sjj.job_id = :job)")
        params["job"] = job

    where_sql = (" WHERE " + " AND ".join(where)) if where else ""

    # 总数
    total = db.execute(
        text(f"SELECT COUNT(*) FROM aoqi_spirit s{where_sql}"),
        params,
    ).scalar_one()

    # 分页（Oracle 12c+ OFFSET/FETCH）
    offset = (page - 1) * size
    rows = db.execute(
        text(
            _LIST_SQL + where_sql +
            " ORDER BY s.race_id"
            f" OFFSET {offset} ROWS FETCH NEXT {size} ROWS ONLY"
        ),
        params,
    ).mappings().all()

    items = [
        SpiritSummary(
            race_id=row["race_id"],
            spirit_name=row["spirit_name"],
            rarity_name=row["rarity_name"],
            position_name=row["position_name"],
            jobs=[j for j in (row["jobs"] or "").split(",") if j],
        )
        for row in rows
    ]
    return items, total


def get_filters(db: Session) -> FilterDict:
    """从字典表动态返回全部筛选项。"""
    def fetch(sql: str) -> List[FilterOption]:
        rows = db.execute(text(sql)).mappings().all()
        return [
            FilterOption(
                code=str(row["code"]),
                name=str(row["name"]),
                sort_no=int(row["sort_no"]),
            )
            for row in rows
        ]

    return FilterDict(
        rarities=fetch(
            "SELECT rarity_code AS code, rarity_name AS name, sort_no "
            "FROM aoqi_rarity WHERE list_filter = 'Y' ORDER BY sort_no"
        ),
        elements=fetch(
            "SELECT element_code AS code, element_code AS name, sort_no "
            "FROM aoqi_element ORDER BY sort_no"
        ),
        jobs=fetch(
            "SELECT job_id AS code, job_name AS name, sort_no "
            "FROM aoqi_job ORDER BY sort_no"
        ),
        eras=fetch(
            "SELECT era_code AS code, era_name AS name, sort_no "
            "FROM aoqi_era ORDER BY sort_no"
        ),
        positions=fetch(
            "SELECT position_code AS code, position_name AS name, sort_no "
            "FROM aoqi_position ORDER BY sort_no"
        ),
    )
