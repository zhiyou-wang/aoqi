/**
 * API 客户端：统一请求封装。
 *
 * 契约类型来自 shared/（与后端 Pydantic 模型一致）。
 * 前端 dev 通过 vite proxy 转发到后端，无需 CORS。
 */
import type {
  ApiResponse,
  FilterDict,
  MaterialConfig,
  SpiritDetail,
  SpiritListQuery,
  SpiritSummary,
} from '../shared';

const BASE = '/api/v1';

async function request<T>(path: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
  const url = new URL(BASE + path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    });
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`请求失败: ${res.status}`);
  }
  return (await res.json()) as ApiResponse<T>;
}

/** 精灵列表 */
export function fetchSpirits(query: SpiritListQuery) {
  return request<SpiritSummary[]>('/spirits', query as Record<string, unknown>);
}

/** 筛选项字典 */
export function fetchFilters() {
  return request<FilterDict>('/spirits/filters');
}

/** 精灵详情 */
export function fetchSpiritDetail(raceId: number) {
  return request<SpiritDetail>(`/spirits/${raceId}`);
}

/** 材质配置 */
export function fetchMaterialConfig() {
  return request<MaterialConfig>('/material-config');
}
