"""羁绊域业务逻辑。"""
from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.schemas.bond import BondCollect, BondForm, BondOverview


def get_bonds(db: Session) -> BondOverview:
    """羁绊总览：上阵羁绊（含成员）+ 收集羁绊（含搭档）。"""
    # 上阵羁绊
    form_rows = db.execute(
        text(
            "SELECT bf.race_id, sp.spirit_name, bf.bond_name, bf.effect_desc, bf.awaken_level, bf.power_factor "
            "FROM aoqi_bond_form bf "
            "JOIN aoqi_spirit sp ON bf.race_id = sp.race_id "
            "ORDER BY bf.race_id"
        )
    ).mappings().all()

    forms: list[BondForm] = []
    for row in form_rows:
        members = db.execute(
            text(
                "SELECT bm.sort_no, bm.member_race_id, msp.spirit_name AS member_name "
                "FROM aoqi_bond_form_member bm "
                "JOIN aoqi_spirit msp ON bm.member_race_id = msp.race_id "
                "WHERE bm.race_id = :race_id ORDER BY bm.sort_no"
            ),
            {"race_id": row["race_id"]},
        ).mappings().all()
        forms.append(BondForm(
            race_id=row["race_id"],
            spirit_name=row["spirit_name"],
            bond_name=row["bond_name"],
            effect_desc=row["effect_desc"],
            awaken_level=row["awaken_level"],
            power_factor=row["power_factor"],
            members=[dict(m) for m in members],
        ))

    # 收集羁绊
    collect_rows = db.execute(
        text(
            "SELECT bc.bond_id, bc.bond_name, bc.stat_text, bc.bonus_percent, bc.effect_desc, "
            "       sp.spirit_name, psp.spirit_name AS partner_name "
            "FROM aoqi_bond_collect bc "
            "LEFT JOIN aoqi_spirit sp ON bc.race_id = sp.race_id "
            "LEFT JOIN aoqi_spirit psp ON bc.partner_race_id = psp.race_id "
            "ORDER BY bc.bond_id"
        )
    ).mappings().all()

    collects = [BondCollect(**dict(r)) for r in collect_rows]

    return BondOverview(forms=forms, collects=collects)
