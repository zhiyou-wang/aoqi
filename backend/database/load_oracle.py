# -*- coding: utf-8 -*-
"""Load the local encyclopedia files into the AOQI Oracle schema."""
import csv
import os
import sys
from pathlib import Path

import oracledb

BACKEND = Path(__file__).resolve().parents[1]  # backend/
ROOT = BACKEND.parent                          # aoqi 根
DATA = BACKEND / "data"
LUA = ROOT / "_raw" / "lua"
sys.path.insert(0, str(BACKEND / "scripts"))
from ljread import load_bytecode

JOBS = {
    "疾速": 1,
    "魔法": 2,
    "利爪": 3,
    "肉盾": 4,
    "平衡": 5,
    "治疗": 6,
    "英雄": 21,
    "召唤师": 22,
    "魔王克星": 23,
    "远古宠": 24,
    "源兽": 25,
    "魔王": 26,
    "神启": 27,
    "通灵师": 28,
    "元素师": 29,
    "神曜": 30,
    "天觉者": 31,
    "源起": 32,
    "唤灵师": 33,
}
ERAS = {"其他": "BASE", "神启": "SHENQI", "神曜": "SHENYAO", "源起": "YUANQI"}
GRADES = {
    "神话": "MYTH",
    "圣品": "HOLY",
    "性转": "GENDER",
    "绝品": "EXQUISITE",
    "臻品": "PRIME",
    "精品": "FINE",
    "良品": "GOOD",
}
SLOTS = {
    "被动": "PASSIVE",
    "普攻": "NORMAL",
    "超杀": "ULT",
    "英雄": "HERO",
    "召唤": "SUMMON",
    "领域": "DOMAIN",
    "元素": "ELEMENT",
    "通灵": "ORACLE",
    "神曜": "SHENYAO",
    "源起": "YUANQI",
    "天觉": "CELESTIAL",
    "元技": "YUANJI",
    "唤灵": "SOUL",
    "觉醒": "AWAKEN",
}
STEPS = {"神曜": "SHENYAO", "源起": "YUANQI", "神启": "SHENQI", "进化": "EVOLVE"}
RARITIES = {"初代": 1, "幻兽": 2, "超能": 3, "传说": 4}
POSITIONS = {"前排": "FRONT", "后排": "BACK"}


def blank(value):
    text = (value or "").strip()
    return text or None


def number(value):
    text = blank(value)
    if text is None:
        return None
    return int(text)


def rows(name):
    with (DATA / name).open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def lua_constants(name):
    return load_bytecode(LUA / name)


def integer_ids(item):
    if not isinstance(item, list):
        return []
    return [value for value in item if isinstance(value, int)]


def is_relation_line(item):
    return (
        isinstance(item, list)
        and len(item) >= 10
        and isinstance(item[1], int)
        and isinstance(item[2], str)
        and item[2].isdigit()
    )


def relation_lines(constants):
    edges = []
    seen = set()
    for index, item in enumerate(constants):
        if not is_relation_line(item):
            continue
        children = []
        cursor = index - 1
        while cursor >= 0 and isinstance(constants[cursor], list) and not is_relation_line(constants[cursor]):
            children.append(constants[cursor])
            cursor -= 1
        children.reverse()
        children = [child for child in children if child not in ([None, 0, 0], [])]
        id_lists = [integer_ids(child) for child in children if integer_ids(child)]
        text_lists = [
            [value for value in child if isinstance(value, str)]
            for child in children
            if any(isinstance(value, str) for value in child)
        ]
        targets = id_lists[-1] if id_lists else []
        labels_out = text_lists[0] if text_lists else []
        labels_back = text_lists[1] if len(text_lists) > 1 else labels_out
        if not (len(labels_out) == len(targets) == len(labels_back)):
            continue
        source = int(item[2])
        for offset, target in enumerate(targets):
            key = (source, target, labels_out[offset], labels_back[offset])
            if key in seen:
                continue
            seen.add(key)
            edges.append((len(edges) + 1, *key))
    return edges


def load_bonds_and_relations(cursor, spirit_ids):
    form_rows = []
    form_members = []
    form_constants = lua_constants("t_pet_relation_ship_on_form.lua")
    for index, item in enumerate(form_constants):
        if not (isinstance(item, list) and len(item) > 8 and isinstance(item[2], str)):
            continue
        race_id = item[1]
        if race_id not in spirit_ids:
            continue
        form_rows.append((race_id, item[2], item[8], item[6], item[5]))
        for sort_no, member_id in enumerate(integer_ids(form_constants[index - 1]), start=1):
            form_members.append((race_id, sort_no, member_id))
    cursor.executemany(
        """
        INSERT INTO aoqi_bond_form (race_id, bond_name, effect_desc, awaken_level, power_factor)
        VALUES (:1, :2, :3, :4, :5)
        """,
        form_rows,
    )
    cursor.executemany(
        """
        INSERT INTO aoqi_bond_form_member (race_id, sort_no, member_race_id)
        VALUES (:1, :2, :3)
        """,
        form_members,
    )

    collect_rows = []
    collect_constants = lua_constants("t_pet_relation_ship_collect.lua")
    for index, item in enumerate(collect_constants):
        if not (isinstance(item, list) and len(item) > 8 and isinstance(item[2], str)):
            continue
        race_id = item[3]
        if race_id not in spirit_ids:
            continue
        partners = integer_ids(collect_constants[index - 1])
        collect_rows.append((item[1], race_id, item[2], partners[0], item[5], item[6] / 100, item[9]))
    cursor.executemany(
        """
        INSERT INTO aoqi_bond_collect (
          bond_id, race_id, bond_name, partner_race_id, stat_text, bonus_percent, effect_desc
        ) VALUES (:1, :2, :3, :4, :5, :6, :7)
        """,
        collect_rows,
    )

    group_rows = []
    group_members = []
    group_constants = lua_constants("t_pet_relation_group.lua")
    for index, item in enumerate(group_constants):
        if not (isinstance(item, list) and len(item) > 3 and isinstance(item[1], int) and isinstance(item[3], str)):
            continue
        group_rows.append((item[1], item[3], item[2]))
        for sort_no, race_id in enumerate(integer_ids(group_constants[index - 1]), start=1):
            group_members.append((item[1], sort_no, race_id))
    cursor.executemany(
        "INSERT INTO aoqi_relation_group (group_id, group_name, tag_name) VALUES (:1, :2, :3)",
        group_rows,
    )
    cursor.executemany(
        "INSERT INTO aoqi_relation_group_member (group_id, sort_no, race_id) VALUES (:1, :2, :3)",
        group_members,
    )

    set_rows = []
    set_members = []
    set_constants = lua_constants("t_pet_relation_group_prize.lua")
    for index, item in enumerate(set_constants):
        if not (isinstance(item, list) and len(item) > 3 and isinstance(item[1], int) and isinstance(item[2], str)):
            continue
        set_rows.append((item[1], item[2], item[4]))
        for sort_no, race_id in enumerate(integer_ids(set_constants[index - 1]), start=1):
            set_members.append((item[1], sort_no, race_id))
    cursor.executemany(
        "INSERT INTO aoqi_relation_set (set_id, set_name, prize_code) VALUES (:1, :2, :3)",
        set_rows,
    )
    cursor.executemany(
        "INSERT INTO aoqi_relation_set_member (set_id, sort_no, race_id) VALUES (:1, :2, :3)",
        set_members,
    )

    team_rows = []
    team_members = []
    team_constants = lua_constants("t_pet_manual_team.lua")
    for index, item in enumerate(team_constants):
        if not (isinstance(item, list) and len(item) > 2 and isinstance(item[1], int) and isinstance(item[2], str)):
            continue
        team_rows.append((item[1], item[2]))
        for sort_no, race_id in enumerate(integer_ids(team_constants[index - 1]), start=1):
            team_members.append((item[1], sort_no, race_id))
    cursor.executemany(
        "INSERT INTO aoqi_relation_team (team_id, team_name) VALUES (:1, :2)",
        team_rows,
    )
    cursor.executemany(
        "INSERT INTO aoqi_relation_team_member (team_id, sort_no, race_id) VALUES (:1, :2, :3)",
        team_members,
    )
    cursor.executemany(
        """
        INSERT INTO aoqi_relation_line (line_id, from_race_id, to_race_id, label_out, label_back)
        VALUES (:1, :2, :3, :4, :5)
        """,
        relation_lines(lua_constants("t_pet_relation_line.lua")),
    )


def main():
    oracledb.init_oracle_client(lib_dir=r"E:\Program\WINDOWS.X64_193000_db_home\bin")
    connection = oracledb.connect(
        user="scott",
        password=os.environ["ORACLE_PASSWORD"],
        dsn="localhost:1521/orclpdb",
    )
    cursor = connection.cursor()
    spirits = rows("spirits.csv")
    spirit_ids = {number(row["race_id"]) for row in spirits}

    cursor.executemany(
        """
        INSERT INTO aoqi_spirit (
          race_id, spirit_name, rarity_code, position_code, book_id,
          gender_code, birthday_text, height_text, weight_text, hobby_text,
          character_text, birthplace_text, self_desc, resume_text,
          strategy_text, introduce_text, hp_score, atk_score, pdef_score,
          mdef_score, spd_score
        ) VALUES (
          :1, :2, :3, :4, :5,
          :6, :7, :8, :9, :10,
          :11, :12, :13, :14, :15,
          :16, :17, :18, :19, :20,
          :21
        )
        """,
        [
            (
                number(row["race_id"]),
                row["name"],
                RARITIES.get(row["rarity"]),
                POSITIONS.get(row["position"]),
                blank(row["book_id"]),
                {"女": "F", "男": "M"}.get(row["gender"]),
                blank(row["birthday"]),
                blank(row["height"]),
                blank(row["weight"]),
                blank(row["hobby"]),
                blank(row["character"]),
                blank(row["birthplace"]),
                blank(row["self_desc"]),
                blank(row["resume"]),
                blank(row["strategy"]),
                blank(row["introduce"]),
                number(row["hp"]),
                number(row["atk"]),
                number(row["pdef"]),
                number(row["mdef"]),
                number(row["spd"]),
            )
            for row in spirits
        ],
    )
    cursor.executemany(
        "UPDATE aoqi_spirit SET lineage_race_id = :1 WHERE race_id = :2",
        [
            (number(row["lineage_id"]), number(row["race_id"]))
            for row in spirits
            if number(row["lineage_id"]) in spirit_ids
        ],
    )

    element_rows = []
    era_rows = []
    for row in spirits:
        race_id = number(row["race_id"])
        for element in [part for part in row["element"].split("、") if part]:
            element_rows.append((race_id, element))
        for era in [part for part in row["era"].split("、") if part]:
            era_rows.append((race_id, ERAS[era]))
    cursor.executemany("INSERT INTO aoqi_spirit_element (race_id, element_code) VALUES (:1, :2)", element_rows)
    cursor.executemany("INSERT INTO aoqi_spirit_era (race_id, era_code) VALUES (:1, :2)", era_rows)
    spirit_job_order = {}
    spirit_jobs = []
    for row in rows("spirit_jobs.csv"):
        race_id = number(row["race_id"])
        job_id = JOBS.get(row["job"])
        if race_id not in spirit_ids or job_id is None:
            continue
        owned = spirit_job_order.setdefault(race_id, [])
        if job_id in owned:
            continue
        owned.append(job_id)
        spirit_jobs.append((race_id, job_id, len(owned)))
    cursor.executemany(
        "INSERT INTO aoqi_spirit_job (race_id, job_id, priority_no) VALUES (:1, :2, :3)",
        spirit_jobs,
    )

    cursor.executemany(
        "INSERT INTO aoqi_evolution (from_race_id, to_race_id, step_code) VALUES (:1, :2, :3)",
        [
            (number(row["from_id"]), number(row["to_id"]), STEPS[row["step"]])
            for row in rows("evolutions.csv")
            if number(row["from_id"]) in spirit_ids and number(row["to_id"]) in spirit_ids
        ],
    )

    skin_rows = [row for row in rows("skins.csv") if number(row["race_id"]) in spirit_ids]
    skins = {}
    wears = []
    for row in skin_rows:
        form_skin_id = number(row["skin_id"])
        group_id = number(row["skin_group"]) or 0
        skin_id = group_id if group_id > 0 else form_skin_id
        grade_code = GRADES.get(row["grade"])
        current = skins.get(skin_id)
        if current is None:
            skins[skin_id] = [row["skin_name"], grade_code, form_skin_id == skin_id]
        else:
            if form_skin_id == skin_id:
                current[0] = row["skin_name"]
                current[2] = True
            if grade_code and not current[1]:
                current[1] = grade_code
        wears.append(
            (
                form_skin_id,
                skin_id,
                number(row["race_id"]),
                blank(row["element"]),
                "Y" if row["is_base"] == "是" else "N",
            )
        )
    cursor.executemany(
        "INSERT INTO aoqi_skin (skin_id, skin_name, grade_code) VALUES (:1, :2, :3)",
        [(skin_id, name, grade_code) for skin_id, (name, grade_code, _canonical) in skins.items()],
    )
    cursor.executemany(
        """
        INSERT INTO aoqi_spirit_skin (form_skin_id, skin_id, race_id, element_code, is_base)
        VALUES (:1, :2, :3, :4, :5)
        """,
        wears,
    )
    skin_jobs = []
    skin_job_order = {}
    for row in skin_rows:
        form_skin_id = number(row["skin_id"])
        for job_name in [part for part in row["jobs"].split("、") if part]:
            job_id = JOBS.get(job_name)
            if job_id is None:
                continue
            owned = skin_job_order.setdefault(form_skin_id, [])
            if job_id in owned:
                continue
            owned.append(job_id)
            skin_jobs.append((form_skin_id, job_id, len(owned)))
    cursor.executemany(
        "INSERT INTO aoqi_skin_job (form_skin_id, job_id, priority_no) VALUES (:1, :2, :3)",
        skin_jobs,
    )

    skill_rows = [row for row in rows("skills.csv") if number(row["race_id"]) in spirit_ids]
    masters = {}
    for row in skill_rows:
        if int(row["level"]) == 1:
            masters[(number(row["race_id"]), row["slot"])] = number(row["skill_id"])
    skill_master = {}
    for row in skill_rows:
        key = (number(row["race_id"]), row["slot"])
        master_id = masters.get(key, number(row["skill_id"]))
        values = (
            blank(row["skill_name"]) or str(master_id),
            blank(row["type"]),
            blank(row["power"]),
            blank(row["target"]),
        )
        current = skill_master.get(master_id)
        if current is None or (current[0] == str(master_id) and values[0] != str(master_id)):
            skill_master[master_id] = values
    cursor.executemany(
        """
        INSERT INTO aoqi_skill (skill_id, skill_name, skill_type, power_type, target_type)
        VALUES (:1, :2, :3, :4, :5)
        """,
        [(skill_id, *values) for skill_id, values in skill_master.items()],
    )
    level_seen = set()
    level_by_id = {}
    for row in skill_rows:
        key = (number(row["race_id"]), row["slot"])
        master_id = masters.get(key, number(row["skill_id"]))
        level_no = int(row["level"])
        level_skill_id = number(row["skill_id"])
        level_key = (master_id, level_no)
        if level_key in level_seen:
            continue
        level_seen.add(level_key)
        candidate = (master_id, level_no, level_skill_id, blank(row["desc"]))
        current = level_by_id.get(level_skill_id)
        if current is None or master_id == level_skill_id:
            level_by_id[level_skill_id] = candidate
    level_rows = list(level_by_id.values())
    cursor.executemany(
        """
        INSERT INTO aoqi_skill_level (skill_id, skill_level, level_skill_id, skill_desc)
        VALUES (:1, :2, :3, :4)
        """,
        level_rows,
    )
    slot_seen = set()
    slot_rows = []
    for row in skill_rows:
        if int(row["level"]) != 1:
            continue
        race_id = number(row["race_id"])
        slot_code = SLOTS[row["slot"]]
        key = (race_id, slot_code)
        if key in slot_seen:
            continue
        slot_seen.add(key)
        slot_rows.append((race_id, slot_code, number(row["skill_id"])))
    cursor.executemany(
        "INSERT INTO aoqi_spirit_skill (race_id, slot_code, skill_id) VALUES (:1, :2, :3)",
        slot_rows,
    )
    load_bonds_and_relations(cursor, spirit_ids)

    connection.commit()
    for table in (
        "aoqi_spirit",
        "aoqi_spirit_job",
        "aoqi_skin",
        "aoqi_spirit_skin",
        "aoqi_evolution",
        "aoqi_skill",
        "aoqi_skill_level",
        "aoqi_spirit_skill",
        "aoqi_bond_form",
        "aoqi_bond_collect",
        "aoqi_relation_group",
        "aoqi_relation_set",
        "aoqi_relation_team",
        "aoqi_relation_line",
    ):
        count = cursor.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        print(table, count)
    cursor.close()
    connection.close()


if __name__ == "__main__":
    main()
