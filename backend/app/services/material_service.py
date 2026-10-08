"""材质配置业务逻辑。

材质阶梯定义在此，是「冷色神迹工艺」的权威来源。
稀有度：初代→哑光、幻兽→玻璃、超能→长虹、传说→液态金属、未探明→磨砂。
皮肤品级：良品→哑光、精品→亮线、臻品→玻璃、绝品→长虹、
          性转→虹彩、圣品→液态金属、神话→Y2K铬。
"""
from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.schemas.material import (
    MaterialConfig,
    MaterialPreset,
    RarityMaterial,
    SkinGradeMaterial,
)

# 稀有度代码 → 材质（对应 aoqi_rarity 的 rarity_code）
_RARITY_MATERIAL: dict[int, MaterialPreset] = {
    1: MaterialPreset(material="matte"),                       # 初代
    2: MaterialPreset(material="glass", fresnel=0.4),          # 幻兽
    3: MaterialPreset(material="fluted", fresnel=0.5),         # 超能
    4: MaterialPreset(material="metal", rim=0.9, fresnel=0.7), # 传说
    0: MaterialPreset(material="frosted"),                     # 未探明（图鉴有、列表筛选无）
}

# 皮肤品级代码 → 材质（对应 aoqi_skin_grade 的 grade_code）
_GRADE_MATERIAL: dict[str, MaterialPreset] = {
    "GOOD": MaterialPreset(material="matte"),                       # 良品
    "FINE": MaterialPreset(material="matte", rim=0.4),              # 精品
    "PRIME": MaterialPreset(material="glass"),                      # 臻品
    "EXQUISITE": MaterialPreset(material="fluted"),                 # 绝品
    "GENDER": MaterialPreset(material="glass", dispersion=6),       # 性转
    "HOLY": MaterialPreset(material="metal", rim=0.8),              # 圣品
    "MYTH": MaterialPreset(material="chrome", rim=1.0, dispersion=12),  # 神话
}


def get_material_config(db: Session) -> MaterialConfig:
    """汇总稀有度与皮肤品级的材质配置。"""
    rarities = db.execute(
        text("SELECT rarity_code, rarity_name FROM aoqi_rarity ORDER BY sort_no")
    ).mappings().all()

    grades = db.execute(
        text("SELECT grade_code, grade_name FROM aoqi_skin_grade ORDER BY sort_no")
    ).mappings().all()

    return MaterialConfig(
        rarities=[
            RarityMaterial(
                rarity_code=r["rarity_code"],
                rarity_name=r["rarity_name"],
                material=_RARITY_MATERIAL.get(r["rarity_code"], MaterialPreset(material="matte")),
            )
            for r in rarities
        ],
        skin_grades=[
            SkinGradeMaterial(
                grade_code=g["grade_code"],
                grade_name=g["grade_name"],
                material=_GRADE_MATERIAL.get(g["grade_code"], MaterialPreset(material="matte")),
            )
            for g in grades
        ],
    )
