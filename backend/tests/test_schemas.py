"""契约模型校验测试（不依赖数据库）。

验证 Pydantic 契约模型的字段定义、默认值、类型校验，
确保前端 shared 类型与后端契约一致。
"""
from __future__ import annotations

import pytest

from app.schemas.grow import EraGrowItem, GrowConfig, GrowItem
from app.schemas.spirit import FilterDict, FilterOption, SpiritDetail, SpiritSummary
from app.schemas.bond import BondForm, BondCollect, BondOverview
from app.schemas.relation import RelationGroup, RelationLine, RelationOverview
from app.schemas.skin import SkinGrade, SkinSummary


class TestSpiritSummary:
    def test_default_lists(self):
        """列表字段默认空列表，避免前端访问 null。"""
        s = SpiritSummary(race_id=1, spirit_name="测试精灵")
        assert s.jobs == []
        assert s.elements == []
        assert s.eras == []
        assert s.rarity_code is None
        assert s.rarity_name is None

    def test_full_fields(self):
        """完整字段可正常构造。"""
        s = SpiritSummary(
            race_id=10001,
            spirit_name="1cm小蓝",
            rarity_code=1,
            rarity_name="初代",
            position_name="前排",
            jobs=["魔法"],
            elements=["水"],
            eras=["BASE"],
        )
        assert s.rarity_code == 1
        assert s.elements == ["水"]
        assert s.jobs == ["魔法"]


class TestSpiritDetail:
    def test_default_lists(self):
        """详情聚合字段默认空列表。"""
        d = SpiritDetail(race_id=1, spirit_name="x")
        assert d.scores == []
        assert d.jobs == []
        assert d.skills == []
        assert d.skins == []
        assert d.evolves_from == []
        assert d.evolves_to == []
        assert d.bonds_form == []
        assert d.bonds_collect == []


class TestFilterDict:
    def test_filter_option_code_is_str(self):
        """筛选项 code 统一是字符串（数据库 NUMBER 转 str）。"""
        f = FilterOption(code="1", name="初代", sort_no=1)
        assert f.code == "1"
        assert isinstance(f.code, str)

    def test_filter_dict_defaults(self):
        fd = FilterDict()
        assert fd.rarities == []
        assert fd.elements == []
        assert fd.jobs == []
        assert fd.eras == []
        assert fd.positions == []


class TestGrowConfig:
    def test_era_map_default(self):
        """养成配置 era_map 默认空字典。"""
        g = GrowConfig()
        assert g.items == []
        assert g.era_map == {}

    def test_era_grow_item(self):
        item = EraGrowItem(grow_item_code="LEVEL", grow_item_name="等级", sort_no=1)
        assert item.grow_item_name == "等级"


class TestBondAndRelation:
    def test_bond_form_default_members(self):
        bf = BondForm(race_id=1)
        assert bf.members == []
        assert bf.power_factor is None  # 修复过：float 而非 int

    def test_bond_overview_defaults(self):
        bo = BondOverview()
        assert bo.forms == []
        assert bo.collects == []

    def test_relation_overview_defaults(self):
        ro = RelationOverview()
        assert ro.groups == []
        assert ro.lines == []


class TestSkin:
    def test_skin_summary_wear_count(self):
        s = SkinSummary(skin_id=1, skin_name="皮肤", wear_count=3)
        assert s.wear_count == 3
