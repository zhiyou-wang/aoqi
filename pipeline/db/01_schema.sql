-- 奥奇传说图鉴
-- 连接：localhost:1521/orclpdb，属主 SCOTT
-- 生产环境应使用独立 schema。当前账号只有 CONNECT、RESOURCE，因此表建在 SCOTT 下，统一 AOQI_ 前缀。

BEGIN
  FOR item IN (
    SELECT table_name
    FROM user_tables
    WHERE table_name LIKE 'AOQI\_%' ESCAPE '\'
  ) LOOP
    EXECUTE IMMEDIATE 'DROP TABLE ' || item.table_name || ' CASCADE CONSTRAINTS PURGE';
  END LOOP;
END;
/

CREATE TABLE aoqi_rarity (
  rarity_code    NUMBER        NOT NULL,
  rarity_name    VARCHAR2(20 CHAR) NOT NULL,
  sort_no        NUMBER        NOT NULL,
  list_filter    CHAR(1 CHAR)  DEFAULT 'Y' NOT NULL,
  CONSTRAINT pk_aoqi_rarity PRIMARY KEY (rarity_code),
  CONSTRAINT uk_aoqi_rarity_name UNIQUE (rarity_name),
  CONSTRAINT ck_aoqi_rarity_filter CHECK (list_filter IN ('Y', 'N'))
);

CREATE TABLE aoqi_element (
  element_code   VARCHAR2(8 CHAR) NOT NULL,
  sort_no        NUMBER        NOT NULL,
  CONSTRAINT pk_aoqi_element PRIMARY KEY (element_code)
);

CREATE TABLE aoqi_era (
  era_code       VARCHAR2(20 CHAR) NOT NULL,
  era_name       VARCHAR2(20 CHAR) NOT NULL,
  sort_no        NUMBER        NOT NULL,
  CONSTRAINT pk_aoqi_era PRIMARY KEY (era_code),
  CONSTRAINT uk_aoqi_era_name UNIQUE (era_name)
);

CREATE TABLE aoqi_position (
  position_code  VARCHAR2(20 CHAR) NOT NULL,
  position_name  VARCHAR2(20 CHAR) NOT NULL,
  sort_no        NUMBER        NOT NULL,
  CONSTRAINT pk_aoqi_position PRIMARY KEY (position_code),
  CONSTRAINT uk_aoqi_position_name UNIQUE (position_name)
);

CREATE TABLE aoqi_job (
  job_id         NUMBER        NOT NULL,
  job_name       VARCHAR2(40 CHAR) NOT NULL,
  job_desc       VARCHAR2(400 CHAR) NOT NULL,
  attack_type    NUMBER        NOT NULL,
  sort_no        NUMBER        NOT NULL,
  CONSTRAINT pk_aoqi_job PRIMARY KEY (job_id),
  CONSTRAINT uk_aoqi_job_name UNIQUE (job_name),
  CONSTRAINT ck_aoqi_job_attack CHECK (attack_type IN (1, 2, 99))
);

CREATE TABLE aoqi_skin_grade (
  grade_code     VARCHAR2(20 CHAR) NOT NULL,
  grade_name     VARCHAR2(20 CHAR) NOT NULL,
  sort_no        NUMBER        NOT NULL,
  CONSTRAINT pk_aoqi_skin_grade PRIMARY KEY (grade_code),
  CONSTRAINT uk_aoqi_skin_grade_name UNIQUE (grade_name)
);

CREATE TABLE aoqi_skill_slot (
  slot_code      VARCHAR2(20 CHAR) NOT NULL,
  slot_name      VARCHAR2(20 CHAR) NOT NULL,
  sort_no        NUMBER        NOT NULL,
  CONSTRAINT pk_aoqi_skill_slot PRIMARY KEY (slot_code),
  CONSTRAINT uk_aoqi_skill_slot_name UNIQUE (slot_name)
);

CREATE TABLE aoqi_spirit (
  race_id          NUMBER         NOT NULL,
  spirit_name      VARCHAR2(200 CHAR) NOT NULL,
  rarity_code      NUMBER,
  position_code    VARCHAR2(20 CHAR),
  lineage_race_id  NUMBER,
  book_id          VARCHAR2(40 CHAR),
  gender_code      CHAR(1 CHAR),
  birthday_text    VARCHAR2(40 CHAR),
  height_text      VARCHAR2(40 CHAR),
  weight_text      VARCHAR2(40 CHAR),
  hobby_text       VARCHAR2(200 CHAR),
  character_text   VARCHAR2(200 CHAR),
  birthplace_text  VARCHAR2(200 CHAR),
  self_desc        VARCHAR2(1000 CHAR),
  resume_text      VARCHAR2(1000 CHAR),
  strategy_text    VARCHAR2(1000 CHAR),
  introduce_text   CLOB,
  hp_score         NUMBER(3),
  atk_score        NUMBER(3),
  pdef_score       NUMBER(3),
  mdef_score       NUMBER(3),
  spd_score        NUMBER(3),
  CONSTRAINT pk_aoqi_spirit PRIMARY KEY (race_id),
  CONSTRAINT fk_aoqi_spirit_rarity FOREIGN KEY (rarity_code) REFERENCES aoqi_rarity (rarity_code),
  CONSTRAINT fk_aoqi_spirit_position FOREIGN KEY (position_code) REFERENCES aoqi_position (position_code),
  CONSTRAINT fk_aoqi_spirit_lineage FOREIGN KEY (lineage_race_id) REFERENCES aoqi_spirit (race_id),
  CONSTRAINT ck_aoqi_spirit_gender CHECK (gender_code IN ('M', 'F'))
);

CREATE TABLE aoqi_spirit_element (
  race_id        NUMBER        NOT NULL,
  element_code   VARCHAR2(8 CHAR) NOT NULL,
  CONSTRAINT pk_aoqi_spirit_element PRIMARY KEY (race_id, element_code),
  CONSTRAINT fk_aoqi_spirit_element_spirit FOREIGN KEY (race_id) REFERENCES aoqi_spirit (race_id),
  CONSTRAINT fk_aoqi_spirit_element_code FOREIGN KEY (element_code) REFERENCES aoqi_element (element_code)
);

CREATE TABLE aoqi_spirit_era (
  race_id        NUMBER        NOT NULL,
  era_code       VARCHAR2(20 CHAR) NOT NULL,
  CONSTRAINT pk_aoqi_spirit_era PRIMARY KEY (race_id, era_code),
  CONSTRAINT fk_aoqi_spirit_era_spirit FOREIGN KEY (race_id) REFERENCES aoqi_spirit (race_id),
  CONSTRAINT fk_aoqi_spirit_era_code FOREIGN KEY (era_code) REFERENCES aoqi_era (era_code)
);

CREATE TABLE aoqi_spirit_job (
  race_id        NUMBER        NOT NULL,
  job_id         NUMBER        NOT NULL,
  priority_no    NUMBER        NOT NULL,
  CONSTRAINT pk_aoqi_spirit_job PRIMARY KEY (race_id, job_id),
  CONSTRAINT uk_aoqi_spirit_job_priority UNIQUE (race_id, priority_no),
  CONSTRAINT fk_aoqi_spirit_job_spirit FOREIGN KEY (race_id) REFERENCES aoqi_spirit (race_id),
  CONSTRAINT fk_aoqi_spirit_job_id FOREIGN KEY (job_id) REFERENCES aoqi_job (job_id),
  CONSTRAINT ck_aoqi_spirit_job_priority CHECK (priority_no >= 1)
);

CREATE TABLE aoqi_evolution (
  from_race_id   NUMBER        NOT NULL,
  to_race_id     NUMBER        NOT NULL,
  step_code      VARCHAR2(20 CHAR) NOT NULL,
  CONSTRAINT pk_aoqi_evolution PRIMARY KEY (from_race_id, to_race_id, step_code),
  CONSTRAINT fk_aoqi_evolution_from FOREIGN KEY (from_race_id) REFERENCES aoqi_spirit (race_id),
  CONSTRAINT fk_aoqi_evolution_to FOREIGN KEY (to_race_id) REFERENCES aoqi_spirit (race_id),
  CONSTRAINT ck_aoqi_evolution_step CHECK (step_code IN ('SHENYAO', 'YUANQI', 'SHENQI', 'EVOLVE')),
  CONSTRAINT ck_aoqi_evolution_self CHECK (from_race_id <> to_race_id)
);

CREATE TABLE aoqi_skin (
  skin_id         NUMBER        NOT NULL,
  skin_name       VARCHAR2(200 CHAR) NOT NULL,
  grade_code      VARCHAR2(20 CHAR),
  CONSTRAINT pk_aoqi_skin PRIMARY KEY (skin_id),
  CONSTRAINT fk_aoqi_skin_grade FOREIGN KEY (grade_code) REFERENCES aoqi_skin_grade (grade_code)
);

CREATE TABLE aoqi_spirit_skin (
  form_skin_id    NUMBER        NOT NULL,
  skin_id         NUMBER        NOT NULL,
  race_id         NUMBER        NOT NULL,
  element_code    VARCHAR2(8 CHAR),
  is_base         CHAR(1 CHAR)  DEFAULT 'N' NOT NULL,
  CONSTRAINT pk_aoqi_spirit_skin PRIMARY KEY (race_id, skin_id),
  CONSTRAINT uk_aoqi_spirit_skin_form UNIQUE (form_skin_id),
  CONSTRAINT fk_aoqi_spirit_skin_skin FOREIGN KEY (skin_id) REFERENCES aoqi_skin (skin_id),
  CONSTRAINT fk_aoqi_spirit_skin_spirit FOREIGN KEY (race_id) REFERENCES aoqi_spirit (race_id),
  CONSTRAINT fk_aoqi_spirit_skin_element FOREIGN KEY (element_code) REFERENCES aoqi_element (element_code),
  CONSTRAINT ck_aoqi_spirit_skin_base CHECK (is_base IN ('Y', 'N'))
);

CREATE TABLE aoqi_skin_job (
  form_skin_id   NUMBER        NOT NULL,
  job_id         NUMBER        NOT NULL,
  priority_no    NUMBER        NOT NULL,
  CONSTRAINT pk_aoqi_skin_job PRIMARY KEY (form_skin_id, job_id),
  CONSTRAINT uk_aoqi_skin_job_priority UNIQUE (form_skin_id, priority_no),
  CONSTRAINT fk_aoqi_skin_job_form FOREIGN KEY (form_skin_id) REFERENCES aoqi_spirit_skin (form_skin_id),
  CONSTRAINT fk_aoqi_skin_job_id FOREIGN KEY (job_id) REFERENCES aoqi_job (job_id),
  CONSTRAINT ck_aoqi_skin_job_priority CHECK (priority_no >= 1)
);

CREATE TABLE aoqi_skill (
  skill_id        NUMBER        NOT NULL,
  skill_name      VARCHAR2(200 CHAR) NOT NULL,
  skill_type      VARCHAR2(40 CHAR),
  power_type      VARCHAR2(40 CHAR),
  target_type     VARCHAR2(80 CHAR),
  CONSTRAINT pk_aoqi_skill PRIMARY KEY (skill_id)
);

CREATE TABLE aoqi_skill_level (
  skill_id         NUMBER       NOT NULL,
  skill_level      NUMBER(2)    NOT NULL,
  level_skill_id   NUMBER       NOT NULL,
  skill_desc       CLOB,
  CONSTRAINT pk_aoqi_skill_level PRIMARY KEY (skill_id, skill_level),
  CONSTRAINT fk_aoqi_skill_level_skill FOREIGN KEY (skill_id) REFERENCES aoqi_skill (skill_id),
  CONSTRAINT ck_aoqi_skill_level_no CHECK (skill_level BETWEEN 1 AND 8)
);

CREATE TABLE aoqi_spirit_skill (
  race_id        NUMBER        NOT NULL,
  slot_code      VARCHAR2(20 CHAR) NOT NULL,
  skill_id       NUMBER        NOT NULL,
  CONSTRAINT pk_aoqi_spirit_skill PRIMARY KEY (race_id, slot_code),
  CONSTRAINT fk_aoqi_spirit_skill_spirit FOREIGN KEY (race_id) REFERENCES aoqi_spirit (race_id),
  CONSTRAINT fk_aoqi_spirit_skill_slot FOREIGN KEY (slot_code) REFERENCES aoqi_skill_slot (slot_code),
  CONSTRAINT fk_aoqi_spirit_skill_skill FOREIGN KEY (skill_id) REFERENCES aoqi_skill (skill_id)
);

CREATE INDEX ix_aoqi_spirit_name ON aoqi_spirit (spirit_name);
CREATE INDEX ix_aoqi_spirit_rarity ON aoqi_spirit (rarity_code);
CREATE INDEX ix_aoqi_spirit_lineage ON aoqi_spirit (lineage_race_id);
CREATE INDEX ix_aoqi_spirit_skin_skin ON aoqi_spirit_skin (skin_id);
CREATE INDEX ix_aoqi_evolution_to ON aoqi_evolution (to_race_id);
CREATE INDEX ix_aoqi_skill_name ON aoqi_skill (skill_name);

COMMENT ON TABLE aoqi_rarity IS '稀有度。图鉴页签含未探明；精灵列表筛选只有可获得的四档。';
COMMENT ON COLUMN aoqi_rarity.list_filter IS 'Y 出现在精灵列表筛选。未探明为 N，这些精灵暂时不能获得。';
COMMENT ON TABLE aoqi_spirit IS '精灵形态。一个种族 ID 一种形态，技能和养成按形态分开。';
COMMENT ON TABLE aoqi_job IS '职业字典，与客户端 t_pet_job 一致。神曜、源起、神启也是职业。';
COMMENT ON COLUMN aoqi_job.attack_type IS '1 物理向基础职业，2 魔法向基础职业，99 特殊职业。';
COMMENT ON TABLE aoqi_spirit_job IS '精灵职业。priority_no 为 1 表示该形态配置里排在最前的职业。';
COMMENT ON TABLE aoqi_spirit_element IS '精灵属性。一个形态可以有多个属性。';
COMMENT ON TABLE aoqi_spirit_era IS '筛选里的时代。神启、神曜、源起在职业表里也有，筛选时归到时代，不进职业栏。';
COMMENT ON TABLE aoqi_evolution IS '进化边。从上一形态到下一形态，步骤为神曜、源起、神启或普通进化。';
COMMENT ON TABLE aoqi_skin IS '一件皮肤。同一件可以给多个时代形态穿，精灵也可以有多件皮肤。';
COMMENT ON TABLE aoqi_spirit_skin IS '精灵与皮肤的多对多。form_skin_id 是该形态在客户端里的皮肤编号。';
COMMENT ON TABLE aoqi_skin_job IS '某个形态穿上这件皮肤时的职业，可以随时代形态变化。';
COMMENT ON TABLE aoqi_skill IS '技能主数据。图鉴和精灵背包打开的是同一条技能。';
COMMENT ON TABLE aoqi_skill_level IS '技能等级文案。';
COMMENT ON TABLE aoqi_spirit_skill IS '形态拥有的技能槽，指向该槽的 1 级技能。';

CREATE TABLE aoqi_bond_form (
  race_id         NUMBER        NOT NULL,
  bond_name       VARCHAR2(40 CHAR) NOT NULL,
  effect_desc     VARCHAR2(400 CHAR) NOT NULL,
  awaken_level    NUMBER        NOT NULL,
  power_factor    NUMBER(6, 4)  NOT NULL,
  CONSTRAINT pk_aoqi_bond_form PRIMARY KEY (race_id),
  CONSTRAINT fk_aoqi_bond_form_spirit FOREIGN KEY (race_id) REFERENCES aoqi_spirit (race_id)
);

CREATE TABLE aoqi_bond_form_member (
  race_id         NUMBER        NOT NULL,
  sort_no         NUMBER        NOT NULL,
  member_race_id  NUMBER        NOT NULL,
  CONSTRAINT pk_aoqi_bond_form_member PRIMARY KEY (race_id, sort_no),
  CONSTRAINT uk_aoqi_bond_form_member UNIQUE (race_id, member_race_id),
  CONSTRAINT fk_aoqi_bond_form_member FOREIGN KEY (race_id) REFERENCES aoqi_bond_form (race_id)
);

CREATE TABLE aoqi_bond_collect (
  bond_id         NUMBER        NOT NULL,
  race_id         NUMBER        NOT NULL,
  bond_name       VARCHAR2(40 CHAR) NOT NULL,
  partner_race_id NUMBER        NOT NULL,
  stat_text       VARCHAR2(20 CHAR) NOT NULL,
  bonus_percent   NUMBER(5, 2)  NOT NULL,
  effect_desc     VARCHAR2(400 CHAR) NOT NULL,
  CONSTRAINT pk_aoqi_bond_collect PRIMARY KEY (bond_id),
  CONSTRAINT fk_aoqi_bond_collect_spirit FOREIGN KEY (race_id) REFERENCES aoqi_spirit (race_id)
);

CREATE TABLE aoqi_relation_group (
  group_id        NUMBER        NOT NULL,
  group_name      VARCHAR2(40 CHAR) NOT NULL,
  tag_name        VARCHAR2(40 CHAR),
  CONSTRAINT pk_aoqi_relation_group PRIMARY KEY (group_id),
  CONSTRAINT uk_aoqi_relation_group_name UNIQUE (group_name)
);

CREATE TABLE aoqi_relation_group_member (
  group_id        NUMBER        NOT NULL,
  sort_no         NUMBER        NOT NULL,
  race_id         NUMBER        NOT NULL,
  CONSTRAINT pk_aoqi_relation_group_member PRIMARY KEY (group_id, sort_no),
  CONSTRAINT fk_aoqi_relation_group_member FOREIGN KEY (group_id) REFERENCES aoqi_relation_group (group_id)
);

CREATE TABLE aoqi_relation_set (
  set_id          NUMBER        NOT NULL,
  set_name        VARCHAR2(40 CHAR) NOT NULL,
  prize_code      VARCHAR2(40 CHAR),
  CONSTRAINT pk_aoqi_relation_set PRIMARY KEY (set_id),
  CONSTRAINT uk_aoqi_relation_set_name UNIQUE (set_name)
);

CREATE TABLE aoqi_relation_set_member (
  set_id          NUMBER        NOT NULL,
  sort_no         NUMBER        NOT NULL,
  race_id         NUMBER        NOT NULL,
  CONSTRAINT pk_aoqi_relation_set_member PRIMARY KEY (set_id, sort_no),
  CONSTRAINT fk_aoqi_relation_set_member FOREIGN KEY (set_id) REFERENCES aoqi_relation_set (set_id)
);

CREATE TABLE aoqi_relation_team (
  team_id         NUMBER        NOT NULL,
  team_name       VARCHAR2(40 CHAR) NOT NULL,
  CONSTRAINT pk_aoqi_relation_team PRIMARY KEY (team_id),
  CONSTRAINT uk_aoqi_relation_team_name UNIQUE (team_name)
);

CREATE TABLE aoqi_relation_team_member (
  team_id         NUMBER        NOT NULL,
  sort_no         NUMBER        NOT NULL,
  race_id         NUMBER        NOT NULL,
  CONSTRAINT pk_aoqi_relation_team_member PRIMARY KEY (team_id, sort_no),
  CONSTRAINT fk_aoqi_relation_team_member FOREIGN KEY (team_id) REFERENCES aoqi_relation_team (team_id)
);

CREATE TABLE aoqi_relation_line (
  line_id         NUMBER        NOT NULL,
  from_race_id    NUMBER        NOT NULL,
  to_race_id      NUMBER        NOT NULL,
  label_out       VARCHAR2(40 CHAR),
  label_back      VARCHAR2(40 CHAR),
  CONSTRAINT pk_aoqi_relation_line PRIMARY KEY (line_id),
  CONSTRAINT uk_aoqi_relation_line UNIQUE (from_race_id, to_race_id, label_out, label_back)
);

COMMENT ON TABLE aoqi_bond_form IS '上阵羁绊。一个形态一条，伙伴在成员表。和精灵关系图没有外键。';
COMMENT ON TABLE aoqi_bond_form_member IS '上阵羁绊伙伴。member_race_id 指向精灵形态，伙伴可以尚未收入图鉴样本。';
COMMENT ON TABLE aoqi_bond_collect IS '收集羁绊。拥有伙伴后，给 race_id 这个形态加一项属性。';
COMMENT ON TABLE aoqi_relation_group IS '精灵关系图上的分组，如暗影军团、蓝龙湾。';
COMMENT ON TABLE aoqi_relation_set IS '关系图分组里的收集子集，如巨龙守护军团。';
COMMENT ON TABLE aoqi_relation_team IS '精灵关系界面右侧的收集组，如龙魂、火之试炼。进度是账号收集数，不入库。';
COMMENT ON TABLE aoqi_relation_line IS '精灵关系图的连线。label 是剧情关系，例如挚友、羁绊关系，不是上阵羁绊的外键。';

CREATE INDEX ix_aoqi_bond_collect_race ON aoqi_bond_collect (race_id);
CREATE INDEX ix_aoqi_relation_line_to ON aoqi_relation_line (to_race_id);

INSERT INTO aoqi_rarity (rarity_code, rarity_name, sort_no, list_filter) VALUES (1, '初代', 1, 'Y');
INSERT INTO aoqi_rarity (rarity_code, rarity_name, sort_no, list_filter) VALUES (2, '幻兽', 2, 'Y');
INSERT INTO aoqi_rarity (rarity_code, rarity_name, sort_no, list_filter) VALUES (3, '超能', 3, 'Y');
INSERT INTO aoqi_rarity (rarity_code, rarity_name, sort_no, list_filter) VALUES (4, '传说', 4, 'Y');
INSERT INTO aoqi_rarity (rarity_code, rarity_name, sort_no, list_filter) VALUES (0, '未探明', 5, 'N');

INSERT INTO aoqi_element (element_code, sort_no) VALUES ('水', 1);
INSERT INTO aoqi_element (element_code, sort_no) VALUES ('火', 2);
INSERT INTO aoqi_element (element_code, sort_no) VALUES ('草', 3);
INSERT INTO aoqi_element (element_code, sort_no) VALUES ('光', 4);
INSERT INTO aoqi_element (element_code, sort_no) VALUES ('暗', 5);
INSERT INTO aoqi_element (element_code, sort_no) VALUES ('源', 6);
INSERT INTO aoqi_element (element_code, sort_no) VALUES ('空', 7);
INSERT INTO aoqi_element (element_code, sort_no) VALUES ('创', 8);

INSERT INTO aoqi_era (era_code, era_name, sort_no) VALUES ('BASE', '其他', 1);
INSERT INTO aoqi_era (era_code, era_name, sort_no) VALUES ('SHENQI', '神启', 2);
INSERT INTO aoqi_era (era_code, era_name, sort_no) VALUES ('SHENYAO', '神曜', 3);
INSERT INTO aoqi_era (era_code, era_name, sort_no) VALUES ('YUANQI', '源起', 4);

INSERT INTO aoqi_position (position_code, position_name, sort_no) VALUES ('FRONT', '前排', 1);
INSERT INTO aoqi_position (position_code, position_name, sort_no) VALUES ('BACK', '后排', 2);

INSERT INTO aoqi_job (job_id, job_name, job_desc, attack_type, sort_no) VALUES (1, '疾速', '拥有超高的速度，上阵后能大幅增加全员速度，为己阵争取先手攻击。', 1, 1);
INSERT INTO aoqi_job (job_id, job_name, job_desc, attack_type, sort_no) VALUES (2, '魔法', '魔法输出，可造成大量伤害。', 2, 2);
INSERT INTO aoqi_job (job_id, job_name, job_desc, attack_type, sort_no) VALUES (3, '利爪', '物理输出，可造成大量伤害。', 1, 3);
INSERT INTO aoqi_job (job_id, job_name, job_desc, attack_type, sort_no) VALUES (4, '肉盾', '适合前排，拥有极强防御能力，可以抵挡大量伤害。', 1, 4);
INSERT INTO aoqi_job (job_id, job_name, job_desc, attack_type, sort_no) VALUES (5, '平衡', '可攻可守，能抵挡一定的伤害，又拥有不错的攻击力。', 1, 5);
INSERT INTO aoqi_job (job_id, job_name, job_desc, attack_type, sort_no) VALUES (6, '治疗', '团队辅助，能给己阵精灵进行治疗，恢复血量。', 2, 6);
INSERT INTO aoqi_job (job_id, job_name, job_desc, attack_type, sort_no) VALUES (21, '英雄', '拥有英雄技，上阵后可以令己阵精灵获得强大的增益效果，大幅提高战斗力。', 99, 21);
INSERT INTO aoqi_job (job_id, job_name, job_desc, attack_type, sort_no) VALUES (22, '召唤师', '拥有召唤技，在战斗中可召唤契约精灵一同作战，上阵第6人，大幅提高战斗力。', 99, 22);
INSERT INTO aoqi_job (job_id, job_name, job_desc, attack_type, sort_no) VALUES (23, '魔王克星', '对魔王造成的伤害最大上限比普通精灵更高，控制技能和削弱效果魔王不能免疫。', 99, 23);
INSERT INTO aoqi_job (job_id, job_name, job_desc, attack_type, sort_no) VALUES (24, '远古宠', '没有详细资料', 99, 24);
INSERT INTO aoqi_job (job_id, job_name, job_desc, attack_type, sort_no) VALUES (25, '源兽', '没有详细资料', 99, 25);
INSERT INTO aoqi_job (job_id, job_name, job_desc, attack_type, sort_no) VALUES (26, '魔王', '普通精灵对魔王造成的伤害有最大上限。魔王免疫普通精灵的控制技能和削弱效果。', 99, 26);
INSERT INTO aoqi_job (job_id, job_name, job_desc, attack_type, sort_no) VALUES (27, '神启', '释放领域技，战斗中可以改变战斗场景，同时大幅提高精灵战斗力。', 99, 27);
INSERT INTO aoqi_job (job_id, job_name, job_desc, attack_type, sort_no) VALUES (28, '通灵师', '拥有超强的唤神技能，唤神后可以进行召唤守护神进行战斗，同时也将增加自己的普攻和超杀技能效果，获得超额输出。', 99, 28);
INSERT INTO aoqi_job (job_id, job_name, job_desc, attack_type, sort_no) VALUES (29, '元素师', '拥有超强的元素之力，可以将己阵上阵的任意一只精灵通过元素之力转化为特定属性', 99, 29);
INSERT INTO aoqi_job (job_id, job_name, job_desc, attack_type, sort_no) VALUES (30, '神曜', '精灵通过神格进化所获得的全新职业，拥有专属神曜技，并且可以通过神格升级逐步解锁神曜技的威力', 99, 30);
INSERT INTO aoqi_job (job_id, job_name, job_desc, attack_type, sort_no) VALUES (31, '天觉者', '同时独立拥有英雄技，通灵技，召唤技效果的职业', 99, 31);
INSERT INTO aoqi_job (job_id, job_name, job_desc, attack_type, sort_no) VALUES (32, '源起', '精灵通过源起进化所获得的全新职业，拥有专属源起技，提升源核可激活更多的源起技效果', 99, 32);
INSERT INTO aoqi_job (job_id, job_name, job_desc, attack_type, sort_no) VALUES (33, '唤灵师', '可召唤出灵体，灵体行动值达到100%后可以出手', 99, 33);

INSERT INTO aoqi_skin_grade (grade_code, grade_name, sort_no) VALUES ('MYTH', '神话', 1);
INSERT INTO aoqi_skin_grade (grade_code, grade_name, sort_no) VALUES ('HOLY', '圣品', 2);
INSERT INTO aoqi_skin_grade (grade_code, grade_name, sort_no) VALUES ('GENDER', '性转', 3);
INSERT INTO aoqi_skin_grade (grade_code, grade_name, sort_no) VALUES ('EXQUISITE', '绝品', 4);
INSERT INTO aoqi_skin_grade (grade_code, grade_name, sort_no) VALUES ('PRIME', '臻品', 5);
INSERT INTO aoqi_skin_grade (grade_code, grade_name, sort_no) VALUES ('FINE', '精品', 6);
INSERT INTO aoqi_skin_grade (grade_code, grade_name, sort_no) VALUES ('GOOD', '良品', 7);

INSERT INTO aoqi_skill_slot (slot_code, slot_name, sort_no) VALUES ('PASSIVE', '被动', 1);
INSERT INTO aoqi_skill_slot (slot_code, slot_name, sort_no) VALUES ('NORMAL', '普攻', 2);
INSERT INTO aoqi_skill_slot (slot_code, slot_name, sort_no) VALUES ('ULT', '超杀', 3);
INSERT INTO aoqi_skill_slot (slot_code, slot_name, sort_no) VALUES ('HERO', '英雄', 4);
INSERT INTO aoqi_skill_slot (slot_code, slot_name, sort_no) VALUES ('SUMMON', '召唤', 5);
INSERT INTO aoqi_skill_slot (slot_code, slot_name, sort_no) VALUES ('DOMAIN', '领域', 6);
INSERT INTO aoqi_skill_slot (slot_code, slot_name, sort_no) VALUES ('ELEMENT', '元素', 7);
INSERT INTO aoqi_skill_slot (slot_code, slot_name, sort_no) VALUES ('ORACLE', '通灵', 8);
INSERT INTO aoqi_skill_slot (slot_code, slot_name, sort_no) VALUES ('SHENYAO', '神曜', 9);
INSERT INTO aoqi_skill_slot (slot_code, slot_name, sort_no) VALUES ('YUANQI', '源起', 10);
INSERT INTO aoqi_skill_slot (slot_code, slot_name, sort_no) VALUES ('CELESTIAL', '天觉', 11);
INSERT INTO aoqi_skill_slot (slot_code, slot_name, sort_no) VALUES ('YUANJI', '元技', 12);
INSERT INTO aoqi_skill_slot (slot_code, slot_name, sort_no) VALUES ('SOUL', '唤灵', 13);
INSERT INTO aoqi_skill_slot (slot_code, slot_name, sort_no) VALUES ('AWAKEN', '觉醒', 14);

COMMIT;
EXIT;
