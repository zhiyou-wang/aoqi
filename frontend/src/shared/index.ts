/**
 * 前后端共享类型与契约。
 *
 * 设计意图：API 契约（响应结构、领域类型、筛选项）集中在这一处，
 * 前端直接 import，后端 Pydantic 模型与之保持一致。
 * 需求变化时先改这里，两端同步。
 */

/** 统一分页元信息 */
export interface PageMeta {
  total: number;
  page: number;
  size: number;
  pages: number;
}

/** 统一响应封装 */
export interface ApiResponse<T> {
  data: T | null;
  meta: PageMeta | null;
  message: string;
}

/** 精灵列表项 */
export interface SpiritSummary {
  race_id: number;
  spirit_name: string;
  rarity_code: number | null;
  rarity_name: string | null;
  position_name: string | null;
  jobs: string[];
  elements: string[];
  eras: string[];
}

/** 筛选项 */
export interface FilterOption {
  code: string;
  name: string;
  sort_no: number;
}

/** 筛选项字典 */
export interface FilterDict {
  rarities: FilterOption[];
  elements: FilterOption[];
  jobs: FilterOption[];
  eras: FilterOption[];
  positions: FilterOption[];
}

/** 列表查询参数 */
export interface SpiritListQuery {
  q?: string;
  rarity?: number;
  element?: string;
  era?: string;
  job?: number;
  position?: string;
  page?: number;
  size?: number;
}

// ---- 精灵详情 ----

/** 精灵职业（带优先级） */
export interface SpiritJobDetail {
  job_id: number;
  job_name: string;
  job_desc: string | null;
  priority_no: number | null;
}

/** 精灵技能（带槽位与等级文案） */
export interface SpiritSkillDetail {
  slot_code: string;
  slot_name: string | null;
  skill_id: number | null;
  skill_name: string | null;
  skill_type: string | null;
  power_type: string | null;
  levels: Array<Record<string, unknown>>;
}

/** 精灵可穿戴皮肤 */
export interface SpiritSkinDetail {
  form_skin_id: number;
  skin_id: number;
  skin_name: string | null;
  grade_code: string | null;
  grade_name: string | null;
  is_base: string | null;
}

/** 精灵详情 */
export interface SpiritDetail {
  race_id: number;
  spirit_name: string;
  rarity_code: number | null;
  rarity_name: string | null;
  position_name: string | null;
  lineage_race_id: number | null;
  book_id: string | null;
  gender_code: string | null;
  birthday_text: string | null;
  height_text: string | null;
  weight_text: string | null;
  hobby_text: string | null;
  character_text: string | null;
  birthplace_text: string | null;
  self_desc: string | null;
  resume_text: string | null;
  strategy_text: string | null;
  introduce_text: string | null;
  scores: number[];
  jobs: SpiritJobDetail[];
  elements: string[];
  eras: string[];
  skills: SpiritSkillDetail[];
  skins: SpiritSkinDetail[];
  evolves_from: number[];
  evolves_to: number[];
  bonds_form: Array<Record<string, unknown>>;
  bonds_collect: Array<Record<string, unknown>>;
}

// ---- 材质配置 ----

/** 材质类型 */
export type MaterialType =
  | 'matte'
  | 'glass'
  | 'fluted'
  | 'metal'
  | 'chrome'
  | 'frosted';

/** 一组材质参数 */
export interface MaterialPreset {
  material: MaterialType;
  refraction?: number | null;
  dispersion?: number | null;
  fresnel?: number | null;
  rim?: number | null;
}

/** 稀有度材质 */
export interface RarityMaterial {
  rarity_code: number;
  rarity_name: string;
  material: MaterialPreset;
}

/** 皮肤品级材质 */
export interface SkinGradeMaterial {
  grade_code: string;
  grade_name: string;
  material: MaterialPreset;
}

/** 材质配置全集 */
export interface MaterialConfig {
  rarities: RarityMaterial[];
  skin_grades: SkinGradeMaterial[];
}
