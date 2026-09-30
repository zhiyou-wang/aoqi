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

from app.schemas.spirit import FilterDict, FilterOption, SpiritDetail, SpiritSummary

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


def get_detail(db: Session, race_id: int) -> SpiritDetail | None:
    """聚合精灵详情：档案 + 技能 + 皮肤 + 进化 + 羁绊。

    全部用显式 join 查询，避免 N+1 懒加载。
    """
    from app.schemas.spirit import (
        SpiritDetail,
        SpiritJobDetail,
        SpiritSkillDetail,
        SpiritSkinDetail,
    )

    # 1. 主表 + 稀有度 + 站位
    base = db.execute(
        text(
            "SELECT s.*, r.rarity_name, p.position_name "
            "FROM aoqi_spirit s "
            "LEFT JOIN aoqi_rarity r ON s.rarity_code = r.rarity_code "
            "LEFT JOIN aoqi_position p ON s.position_code = p.position_code "
            "WHERE s.race_id = :race_id"
        ),
        {"race_id": race_id},
    ).mappings().first()
    if base is None:
        return None

    # 2. 职业（带优先级）
    jobs = db.execute(
        text(
            "SELECT sj.job_id, j.job_name, j.job_desc, sj.priority_no "
            "FROM aoqi_spirit_job sj JOIN aoqi_job j ON sj.job_id = j.job_id "
            "WHERE sj.race_id = :race_id ORDER BY sj.priority_no"
        ),
        {"race_id": race_id},
    ).mappings().all()

    # 3. 元素 / 时代
    elements = [r[0] for r in db.execute(
        text("SELECT element_code FROM aoqi_spirit_element WHERE race_id = :race_id"),
        {"race_id": race_id},
    ).all()]
    eras = [r[0] for r in db.execute(
        text("SELECT era_code FROM aoqi_spirit_era WHERE race_id = :race_id"),
        {"race_id": race_id},
    ).all()]

    # 4. 技能（槽位 + 等级文案）
    skill_rows = db.execute(
        text(
            "SELECT ss.slot_code, sl.slot_name, ss.skill_id, sk.skill_name, "
            "       sk.skill_type, sk.power_type "
            "FROM aoqi_spirit_skill ss "
            "LEFT JOIN aoqi_skill_slot sl ON ss.slot_code = sl.slot_code "
            "LEFT JOIN aoqi_skill sk ON ss.skill_id = sk.skill_id "
            "WHERE ss.race_id = :race_id ORDER BY sl.sort_no"
        ),
        {"race_id": race_id},
    ).mappings().all()

    skills: list[SpiritSkillDetail] = []
    for row in skill_rows:
        levels = [
            dict(r) for r in db.execute(
                text(
                    "SELECT skill_level, level_skill_id, skill_desc "
                    "FROM aoqi_skill_level WHERE skill_id = :skill_id ORDER BY skill_level"
                ),
                {"skill_id": row["skill_id"]},
            ).mappings().all()
        ] if row["skill_id"] else []
        skills.append(SpiritSkillDetail(
            slot_code=row["slot_code"],
            slot_name=row["slot_name"],
            skill_id=row["skill_id"],
            skill_name=row["skill_name"],
            skill_type=row["skill_type"],
            power_type=row["power_type"],
            levels=levels,
        ))

    # 5. 皮肤（穿戴关系）
    skin_rows = db.execute(
        text(
            "SELECT ss.form_skin_id, ss.skin_id, sk.skin_name, sk.grade_code, sg.grade_name, ss.is_base "
            "FROM aoqi_spirit_skin ss "
            "JOIN aoqi_skin sk ON ss.skin_id = sk.skin_id "
            "LEFT JOIN aoqi_skin_grade sg ON sk.grade_code = sg.grade_code "
            "WHERE ss.race_id = :race_id"
        ),
        {"race_id": race_id},
    ).mappings().all()
    skins = [SpiritSkinDetail(**dict(r)) for r in skin_rows]

    # 6. 进化
    evolves_from = [r[0] for r in db.execute(
        text("SELECT from_race_id FROM aoqi_evolution WHERE to_race_id = :race_id"),
        {"race_id": race_id},
    ).all()]
    evolves_to = [r[0] for r in db.execute(
        text("SELECT to_race_id FROM aoqi_evolution WHERE from_race_id = :race_id"),
        {"race_id": race_id},
    ).all()]

    # 7. 羁绊（上阵 + 收集）
    bonds_form = [dict(r) for r in db.execute(
        text("SELECT * FROM aoqi_bond_form WHERE race_id = :race_id"),
        {"race_id": race_id},
    ).mappings().all()]
    bonds_collect = [dict(r) for r in db.execute(
        text("SELECT * FROM aoqi_bond_collect WHERE race_id = :race_id"),
        {"race_id": race_id},
    ).mappings().all()]

    return SpiritDetail(
        race_id=base["race_id"],
        spirit_name=base["spirit_name"],
        rarity_name=base["rarity_name"],
        position_name=base["position_name"],
        lineage_race_id=base["lineage_race_id"],
        book_id=base["book_id"],
        gender_code=base["gender_code"],
        birthday_text=base["birthday_text"],
        height_text=base["height_text"],
        weight_text=base["weight_text"],
        hobby_text=base["hobby_text"],
        character_text=base["character_text"],
        birthplace_text=base["birthplace_text"],
        self_desc=base["self_desc"],
        resume_text=base["resume_text"],
        strategy_text=base["strategy_text"],
        introduce_text=base["introduce_text"],
        scores=[base["hp_score"], base["atk_score"], base["pdef_score"], base["mdef_score"], base["spd_score"]],
        jobs=[SpiritJobDetail(**dict(j)) for j in jobs],
        elements=elements,
        eras=eras,
        skills=skills,
        skins=skins,
        evolves_from=evolves_from,
        evolves_to=evolves_to,
        bonds_form=bonds_form,
        bonds_collect=bonds_collect,
    )
