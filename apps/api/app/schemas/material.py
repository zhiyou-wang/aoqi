"""材质配置：稀有度/品级 → 材质参数。

材质阶梯（冷色神迹工艺）定义见 docs/04-材质系统.md。
后端统一下发，前端只消费，保证材质阶梯可动态调整。
"""
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class MaterialPreset(BaseModel):
    """一组材质参数。"""

    material: str = Field(description="材质类型：matte/glass/fluted/metal/chrome/frosted")
    refraction: Optional[float] = Field(None, description="折射强度")
    dispersion: Optional[float] = Field(None, description="色散强度")
    fresnel: Optional[float] = Field(None, description="菲涅尔强度")
    rim: Optional[float] = Field(None, description="边缘光强度")


class RarityMaterial(BaseModel):
    """稀有度 → 材质。"""

    rarity_code: int
    rarity_name: str
    material: MaterialPreset


class SkinGradeMaterial(BaseModel):
    """皮肤品级 → 材质。"""

    grade_code: str
    grade_name: str
    material: MaterialPreset


class MaterialConfig(BaseModel):
    """材质配置全集。"""

    rarities: List[RarityMaterial] = Field(default_factory=list)
    skin_grades: List[SkinGradeMaterial] = Field(default_factory=list)
