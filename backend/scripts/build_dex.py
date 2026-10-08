# -*- coding: utf-8 -*-
"""Build the spirit table from the local game config bytecode."""
import csv
import json
import sqlite3
from pathlib import Path

from ljread import rows_by_schema

BACKEND = Path(__file__).resolve().parents[1]  # backend/
ROOT = BACKEND.parent                          # aoqi 根
LUA = ROOT / "_raw" / "lua"
DATA = BACKEND / "data"
WEB = ROOT / "prototype"

RARITY = {1: "初代", 2: "幻兽", 3: "超能", 4: "传说"}
ERA_TOKENS = ("源起", "神曜", "神启")
# t_pet_skin_tab2：页签名对应皮肤 quality，不是 1 到 7 顺排。
SKIN_GRADE = {10: "神话", 8: "圣品", 6: "性转", 9: "绝品", 7: "臻品", 5: "精品", 3: "良品"}
GENDER = {1: "女", 2: "男"}


def clean(value):
    if value is None or value is False:
        return ""
    if isinstance(value, bool):
        return ""
    if isinstance(value, float):
        if value == int(value):
            return str(int(value))
        return str(value)
    return str(value).replace("\r\n", "\n").strip()


def split_jobs(value, known):
    text = clean(value).replace("，", ",").replace("、", ",")
    if not text:
        return []
    jobs = []
    for part in text.split(","):
        part = part.strip()
        if not part:
            continue
        pieces = [bit.strip() for bit in part.replace("．", ".").split(".") if bit.strip()]
        if len(pieces) > 1 and all(bit in known for bit in pieces):
            jobs.extend(pieces)
        else:
            jobs.append(part)
    seen = []
    for job in jobs:
        if job not in seen:
            seen.append(job)
    return seen


def skin_title(skin, spirit_name):
    for key in ("skinName", "name"):
        value = skin.get(key)
        if isinstance(value, str) and value and not value.isdigit():
            return value
    skin_id = skin.get("skinId")
    if skin_id:
        return "%s #%s" % (spirit_name, skin_id)
    return spirit_name


def choose_skin(group, race_id, name):
    if not group:
        return None

    def element_of(skin):
        element = skin.get("elementAttr")
        return element if isinstance(element, str) and element else ""

    for skin in group:
        if skin.get("skinId") == race_id and element_of(skin):
            return skin
    for skin in group:
        if skin.get("skinName") == name and element_of(skin):
            return skin
    for skin in group:
        if element_of(skin):
            return skin
    return group[0]


def position_of(info, strategy):
    for source in (info.get("bestPosition"), strategy.get("stand")):
        text = clean(source)
        if "前排" in text:
            return "前排"
        if "后排" in text:
            return "后排"
    plan = strategy.get("plan")
    if plan == 1:
        return "前排"
    if plan == 2:
        return "后排"
    return ""


def radar_of(strategy):
    raw = strategy.get("proerty")
    if not isinstance(raw, str) or "[" not in raw:
        return ["", "", "", "", ""]
    body = raw.strip().strip("[]")
    parts = [part.strip().strip("'") for part in body.split(",")]
    while len(parts) < 5:
        parts.append("")
    return parts[:5]


def load_skill_catalog():
    catalog = {}
    for row in rows_by_schema(LUA / "t_btl_skill.lua", "id"):
        skill_id = row.get("id")
        if not isinstance(skill_id, int):
            continue
        catalog[skill_id] = {
            "id": skill_id,
            "name": clean(row.get("name")),
            "desc": clean(row.get("desc")),
            "type": clean(row.get("type")),
            "power": clean(row.get("powerType")),
            "target": clean(row.get("targetType")),
            "function": clean(row.get("funtionType")),
        }
    return catalog


def skill_levels(skill_id, catalog):
    first = catalog.get(skill_id)
    if not first:
        return []
    levels = []
    for offset in range(8):
        current = catalog.get(skill_id + offset)
        if not current or current["name"] != first["name"]:
            break
        levels.append({"lv": offset + 1, "id": current["id"], "desc": current["desc"]})
    return levels


def form_skills(skin, catalog):
    if not skin:
        return []
    result = []
    for label, key in SLOT_FIELDS:
        skill_id = skin.get(key)
        if not isinstance(skill_id, int) or skill_id <= 0:
            continue
        info = catalog.get(skill_id, {})
        result.append(
            {
                "slot": label,
                "id": skill_id,
                "name": info.get("name", ""),
                "type": info.get("type") or label,
                "power": info.get("power", ""),
                "target": info.get("target", ""),
                "function": info.get("function", ""),
                "levels": skill_levels(skill_id, catalog),
            }
        )
    return result


SLOT_FIELDS = [
    ("被动", "passiveSkillId"),
    ("普攻", "normalSkillId"),
    ("超杀", "ultSkillId"),
    ("英雄", "heroSkillId"),
    ("召唤", "summonSkillId"),
    ("领域", "domainSkillId"),
    ("元素", "elementSkillId"),
    ("通灵", "oracleSkillId"),
    ("神曜", "shenyaoSkillId"),
    ("源起", "sourceSkillId"),
    ("天觉", "heavenAwakenSkillId"),
    ("元技", "yuanjiSkillId"),
    ("唤灵", "spiritInvocationSkillId"),
    ("觉醒", "awakenSkillId"),
]


def skill_slots(skin):
    if not skin:
        return ""
    slots = [
        ("被动", "passiveSkillId"),
        ("普攻", "normalSkillId"),
        ("超杀", "ultSkillId"),
        ("英雄", "heroSkillId"),
        ("召唤", "summonSkillId"),
        ("领域", "domainSkillId"),
        ("元素", "elementSkillId"),
        ("通灵", "oracleSkillId"),
        ("神曜", "shenyaoSkillId"),
        ("源起", "sourceSkillId"),
        ("天觉", "heavenAwakenSkillId"),
        ("元技", "yuanjiSkillId"),
        ("唤灵", "spiritInvocationSkillId"),
        ("觉醒", "awakenSkillId"),
    ]
    found = []
    for label, key in slots:
        value = skin.get(key)
        if isinstance(value, int) and value > 0:
            found.append("%s:%s" % (label, value))
    return " ".join(found)


def load_all():
    info = {row["raceId"]: row for row in rows_by_schema(LUA / "t_pet_info.lua", "raceId")}
    base = {row["raceId"]: row for row in rows_by_schema(LUA / "t_pet.lua", "raceId")}
    details = {row["raceId"]: row for row in rows_by_schema(LUA / "t_pet_details.lua", "raceId")}
    strategy = {row["raceId"]: row for row in rows_by_schema(LUA / "t_pet_strategy.lua", "raceId")}
    jobs = rows_by_schema(LUA / "t_pet_job.lua", "id")
    known_jobs = {clean(row.get("name")) for row in jobs if clean(row.get("name"))}
    skins = rows_by_schema(LUA / "t_pet_skin.lua", "skinId")
    by_race = {}
    for skin in skins:
        by_race.setdefault(skin.get("raceId"), []).append(skin)
    return info, base, details, strategy, by_race, known_jobs


def collect_skins(group, race_id, name, known_jobs):
    skins = []
    seen = set()
    for skin in group:
        skin_id = skin.get("skinId")
        if skin_id in seen:
            continue
        seen.add(skin_id)
        element = skin.get("elementAttr")
        element = element if isinstance(element, str) else ""
        hidden = skin.get("isHide") in (1, True, "1") or skin.get("clientNotShow") in (1, True, "1")
        quality = skin.get("quality")
        is_base = skin_id == race_id
        if is_base:
            grade = ""
        elif isinstance(quality, int) and quality in SKIN_GRADE:
            grade = SKIN_GRADE[quality]
        else:
            grade = ""
        group = skin.get("skinGroup") if isinstance(skin.get("skinGroup"), int) else ""
        skins.append(
            {
                "id": skin_id,
                "name": skin_title(skin, name),
                "element": element,
                "jobs": split_jobs(skin.get("job"), known_jobs),
                "base": is_base,
                "hidden": hidden,
                "grade": grade,
                "group": group,
                "skills": skill_slots(skin),
            }
        )
    skins.sort(key=lambda item: (not item["base"], item["id"] if isinstance(item["id"], int) else 0))
    return skins


def build_records():
    info, base, details, strategy, skins, known_jobs = load_all()
    catalog = load_skill_catalog()
    race_ids = sorted(set(info) | set(base), key=lambda value: (not isinstance(value, int), value))
    records = []
    for race_id in race_ids:
        info_row = info.get(race_id, {})
        base_row = base.get(race_id, {})
        detail_row = details.get(race_id, {})
        strategy_row = strategy.get(race_id, {})
        name = clean(info_row.get("name")) or clean(base_row.get("name"))
        if not name:
            continue
        skin_rows = collect_skins(skins.get(race_id, []), race_id, name, known_jobs)
        skin = choose_skin(skins.get(race_id, []), race_id, name)
        jobs = split_jobs(detail_row.get("role"), known_jobs)
        for item in skin_rows:
            for job in item["jobs"]:
                if job not in jobs:
                    jobs.append(job)
        if not jobs and skin:
            jobs = split_jobs(skin.get("job"), known_jobs)
        eras = [token for token in ERA_TOKENS if token in jobs]
        elements = []
        for item in skin_rows:
            if item["element"] and item["element"] not in elements:
                elements.append(item["element"])
        element = "、".join(elements)
        gender = ""
        if skin:
            gender = GENDER.get(skin.get("genderId"), "")
        rare = base_row.get("rare")
        book = clean(base_row.get("bookIds"))
        radar = radar_of(strategy_row)
        skill_list = form_skills(skin, catalog)
        records.append(
            {
                "race_id": race_id,
                "name": name,
                "rarity": RARITY.get(rare, clean(rare)),
                "rare": rare if isinstance(rare, int) else "",
                "element": element,
                "elements": elements,
                "jobs": "、".join(jobs),
                "job_list": jobs,
                "skins": skin_rows,
                "era": "、".join(eras) if eras else "其他",
                "position": position_of(info_row, strategy_row),
                "label": clean(info_row.get("label")),
                "resume": clean(strategy_row.get("resume")) if isinstance(strategy_row.get("resume"), str) else "",
                "evaluate": clean(strategy_row.get("evaluate")) if isinstance(strategy_row.get("evaluate"), str) else "",
                "strategy": clean(info_row.get("stragegy")),
                "introduce": clean(info_row.get("introduce")),
                "gender": gender,
                "birthday": clean(detail_row.get("birthday")),
                "height": clean(detail_row.get("height")),
                "weight": clean(detail_row.get("weight")),
                "hobby": clean(detail_row.get("hobby")),
                "character": clean(detail_row.get("character")),
                "birthplace": clean(detail_row.get("birthplace")),
                "self_desc": clean(detail_row.get("selfDesc")),
                "hp": base_row.get("hpScore") if isinstance(base_row.get("hpScore"), int) else "",
                "atk": base_row.get("attScore") if isinstance(base_row.get("attScore"), int) else "",
                "pdef": base_row.get("defPhyScore") if isinstance(base_row.get("defPhyScore"), int) else "",
                "mdef": base_row.get("defMagScore") if isinstance(base_row.get("defMagScore"), int) else "",
                "spd": base_row.get("speedScore") if isinstance(base_row.get("speedScore"), int) else "",
                "radar_hp": radar[0],
                "radar_atk": radar[1],
                "radar_pdef": radar[2],
                "radar_mdef": radar[3],
                "radar_spd": radar[4],
                "max_lv": base_row.get("maxLv") if isinstance(base_row.get("maxLv"), int) else "",
                "star_plan": base_row.get("SGPRecommendId") if isinstance(base_row.get("SGPRecommendId"), int) else "",
                "book_id": book,
                "in_dex": "是" if book else "否",
                "skill_list": skill_list,
                "skills": " ".join("%s:%s" % (item["slot"], item["name"] or item["id"]) for item in skill_list),
                "lineage_id": race_id,
                "evolve_from": "",
                "evolve_to": "",
                "forms": [],
            }
        )
    edges = evolution_edges()
    link_lineage(records, edges)
    return records, edges


def evolution_edges():
    edges = []
    plus = rows_by_schema(LUA / "t_pet_divine_plus_evolution.lua", "raceId")
    for row in plus:
        src, dst = row.get("raceId"), row.get("newRaceId")
        if isinstance(src, int) and isinstance(dst, int):
            kind = "源起" if row.get("evolutionType") == 2 or row.get("txt") == "源起进化" else "神曜"
            edges.append((src, dst, kind))
    divine = rows_by_schema(LUA / "t_pet_divine_evolution.lua", "raceId")
    for row in divine:
        src, dst = row.get("raceId"), row.get("newRaceId")
        if isinstance(src, int) and isinstance(dst, int):
            edges.append((src, dst, "神启"))
    older = rows_by_schema(LUA / "t_pet_evolve.lua", "raceId")
    for row in older:
        src, dst = row.get("raceId"), row.get("newRaceId")
        if isinstance(src, int) and isinstance(dst, int):
            edges.append((src, dst, "进化"))
    return edges


def link_lineage(records, edges):
    parent = {}

    def find(item):
        while parent[item] != item:
            parent[item] = parent[parent[item]]
            item = parent[item]
        return item

    def union(left, right):
        if left not in parent or right not in parent:
            return
        left, right = find(left), find(right)
        if left != right:
            parent[right] = left

    for record in records:
        if isinstance(record["race_id"], int):
            parent[record["race_id"]] = record["race_id"]
    for src, dst, _kind in edges:
        union(src, dst)
    grouped = {}
    for record in records:
        for skin in record["skins"]:
            if skin["base"] or not isinstance(skin["group"], int) or skin["group"] <= 0:
                continue
            grouped.setdefault(skin["group"], set()).add(record["race_id"])
    for races in grouped.values():
        races = [race for race in races if race in parent]
        for other in races[1:]:
            union(races[0], other)
    by_id = {record["race_id"]: record for record in records}
    incoming = {}
    outgoing = {}
    for src, dst, kind in edges:
        outgoing.setdefault(src, []).append((dst, kind))
        incoming.setdefault(dst, []).append((src, kind))
    members = {}
    for race_id in parent:
        members.setdefault(find(race_id), []).append(race_id)
    for record in records:
        race_id = record["race_id"]
        if race_id not in parent:
            continue
        root = find(race_id)
        form_ids = sorted(members[root])
        record["lineage_id"] = min(form_ids)
        record["forms"] = [
            {
                "id": other,
                "name": by_id[other]["name"],
                "era": by_id[other]["era"],
                "jobs": by_id[other]["job_list"],
                "skills": by_id[other]["skills"],
            }
            for other in form_ids
            if other in by_id
        ]
        record["evolve_from"] = "；".join(
            "%s（%s）" % (by_id[src]["name"], kind) for src, kind in incoming.get(race_id, []) if src in by_id
        )
        record["evolve_to"] = "；".join(
            "%s（%s）" % (by_id[dst]["name"], kind) for dst, kind in outgoing.get(race_id, []) if dst in by_id
        )


COLUMNS = [
    "race_id",
    "name",
    "rarity",
    "element",
    "jobs",
    "era",
    "position",
    "label",
    "resume",
    "evaluate",
    "strategy",
    "gender",
    "birthday",
    "height",
    "weight",
    "hobby",
    "character",
    "birthplace",
    "self_desc",
    "hp",
    "atk",
    "pdef",
    "mdef",
    "spd",
    "max_lv",
    "star_plan",
    "book_id",
    "in_dex",
    "lineage_id",
    "evolve_from",
    "evolve_to",
    "skills",
    "introduce",
]


def write_csv(records, edges):
    DATA.mkdir(parents=True, exist_ok=True)
    path = DATA / "spirits.csv"
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=COLUMNS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(records)
    jobs_path = DATA / "spirit_jobs.csv"
    with jobs_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["race_id", "name", "job"])
        writer.writeheader()
        for record in records:
            for job in record["job_list"]:
                writer.writerow({"race_id": record["race_id"], "name": record["name"], "job": job})
    skins_path = DATA / "skins.csv"
    with skins_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["race_id", "spirit_name", "skin_id", "skin_name", "grade", "skin_group", "element", "jobs", "is_base", "hidden"],
        )
        writer.writeheader()
        for record in records:
            for skin in record["skins"]:
                writer.writerow(
                    {
                        "race_id": record["race_id"],
                        "spirit_name": record["name"],
                        "skin_id": skin["id"],
                        "skin_name": skin["name"],
                        "grade": skin["grade"],
                        "skin_group": skin["group"],
                        "element": skin["element"],
                        "jobs": "、".join(skin["jobs"]),
                        "is_base": "是" if skin["base"] else "否",
                        "hidden": "是" if skin["hidden"] else "否",
                    }
                )
    evolve_path = DATA / "evolutions.csv"
    with evolve_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["from_id", "to_id", "step"])
        writer.writeheader()
        for src, dst, kind in edges:
            writer.writerow({"from_id": src, "to_id": dst, "step": kind})
    skill_path = DATA / "skills.csv"
    with skill_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["race_id", "spirit_name", "slot", "level", "skill_id", "skill_name", "type", "power", "target", "function", "desc"],
        )
        writer.writeheader()
        for record in records:
            for skill in record["skill_list"]:
                levels = skill["levels"] or [{"lv": 1, "id": skill["id"], "desc": ""}]
                for level in levels:
                    writer.writerow(
                        {
                            "race_id": record["race_id"],
                            "spirit_name": record["name"],
                            "slot": skill["slot"],
                            "level": level["lv"],
                            "skill_id": level["id"],
                            "skill_name": skill["name"],
                            "type": skill["type"],
                            "power": skill["power"],
                            "target": skill["target"],
                            "function": skill["function"],
                            "desc": level["desc"],
                        }
                    )
    return path


def write_sqlite(records):
    path = DATA / "spirits.sqlite"
    if path.exists():
        path.unlink()
    connection = sqlite3.connect(path)
    columns = ", ".join("%s TEXT" % name for name in COLUMNS)
    connection.execute("CREATE TABLE spirits (%s)" % columns)
    placeholders = ", ".join("?" for _ in COLUMNS)
    connection.executemany(
        "INSERT INTO spirits VALUES (%s)" % placeholders,
        [[clean(record.get(name)) for name in COLUMNS] for record in records],
    )
    connection.execute("CREATE INDEX idx_spirits_name ON spirits(name)")
    connection.execute("CREATE INDEX idx_spirits_element ON spirits(element)")
    connection.execute("CREATE INDEX idx_spirits_rarity ON spirits(rarity)")
    connection.execute("CREATE TABLE spirit_jobs (race_id TEXT, name TEXT, job TEXT)")
    connection.execute(
        "CREATE TABLE skins (race_id TEXT, spirit_name TEXT, skin_id TEXT, skin_name TEXT, grade TEXT, skin_group TEXT, element TEXT, jobs TEXT, is_base TEXT, hidden TEXT)"
    )
    connection.executemany(
        "INSERT INTO spirit_jobs VALUES (?, ?, ?)",
        [(record["race_id"], record["name"], job) for record in records for job in record["job_list"]],
    )
    connection.executemany(
        "INSERT INTO skins VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            (
                record["race_id"],
                record["name"],
                skin["id"],
                skin["name"],
                skin["grade"],
                skin["group"],
                skin["element"],
                "、".join(skin["jobs"]),
                "是" if skin["base"] else "否",
                "是" if skin["hidden"] else "否",
            )
            for record in records
            for skin in record["skins"]
        ],
    )
    connection.execute(
        "CREATE TABLE skills (race_id TEXT, spirit_name TEXT, slot TEXT, level TEXT, skill_id TEXT, skill_name TEXT, type TEXT, power TEXT, target TEXT, function TEXT, desc TEXT)"
    )
    connection.executemany(
        "INSERT INTO skills VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            (
                record["race_id"],
                record["name"],
                skill["slot"],
                level["lv"],
                level["id"],
                skill["name"],
                skill["type"],
                skill["power"],
                skill["target"],
                skill["function"],
                level["desc"],
            )
            for record in records
            for skill in record["skill_list"]
            for level in (skill["levels"] or [{"lv": 1, "id": skill["id"], "desc": ""}])
        ],
    )
    connection.commit()
    connection.close()
    return path


def write_web(records):
    WEB.mkdir(parents=True, exist_ok=True)
    payload = []
    for record in records:
        payload.append(
            {
                "id": record["race_id"],
                "name": record["name"],
                "rarity": record["rarity"],
                "element": record["element"],
                "elements": record["elements"],
                "jobs": record["job_list"],
                "skins": [
                    {
                        "id": skin["id"],
                        "name": skin["name"],
                        "element": skin["element"],
                        "jobs": skin["jobs"],
                        "base": skin["base"],
                        "hidden": skin["hidden"],
                        "grade": skin["grade"],
                        "group": skin["group"],
                    }
                    for skin in record["skins"]
                ],
                "era": record["era"],
                "evolveFrom": record["evolve_from"],
                "evolveTo": record["evolve_to"],
                "forms": record["forms"],
                "position": record["position"],
                "label": record["label"],
                "resume": record["resume"],
                "strategy": record["strategy"],
                "gender": record["gender"],
                "birthday": record["birthday"],
                "height": record["height"],
                "weight": record["weight"],
                "hobby": record["hobby"],
                "character": record["character"],
                "birthplace": record["birthplace"],
                "selfDesc": record["self_desc"],
                "scores": [record["hp"], record["atk"], record["pdef"], record["mdef"], record["spd"]],
                "inDex": record["in_dex"],
                "bookId": record["book_id"],
                "skills": record["skills"],
                "skillList": record["skill_list"],
                "introduce": record["introduce"],
            }
        )
    (WEB / "spirits.js").write_text(
        "window.SPIRITS = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )


def main():
    records, edges = build_records()
    csv_path = write_csv(records, edges)
    db_path = write_sqlite(records)
    write_web(records)
    named = [row for row in records if "·" in row["name"]]
    print("records", len(records))
    print("named", len(named))
    print("in_dex", sum(1 for row in records if row["in_dex"] == "是"))
    print("csv", csv_path)
    print("db", db_path)
    sample = next(row for row in records if row["race_id"] == 14051)
    first = sample["skill_list"][0] if sample["skill_list"] else {}
    print("sample", sample["name"], first.get("name"), first.get("type"), len(first.get("levels") or []))
    print("skins", sum(len(row["skins"]) for row in records))
    print("multi job", sum(1 for row in records if len(row["job_list"]) > 1))
    print("multi skin", sum(1 for row in records if len(row["skins"]) > 1))
    moyan = next(row for row in records if row["race_id"] == 12009)
    print("moyan forms", [(form["name"], form["era"]) for form in moyan["forms"]])


if __name__ == "__main__":
    main()
