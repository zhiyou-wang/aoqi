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
  rarity_name: string | null;
  position_name: string | null;
  jobs: string[];
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
  job?: number;
  position?: string;
  page?: number;
  size?: number;
}
