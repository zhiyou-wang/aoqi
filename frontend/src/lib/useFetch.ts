import { useEffect, useState } from 'react';

/**
 * 轻量数据请求 hook（替代 TanStack Query）。
 *
 * 在「请求 + 竞态取消 + 错误捕获」基础上，增加模块级 SWR 缓存
 * （stale-while-revalidate）：
 *   - 命中缓存：立即渲染旧数据（loading=false），后台静默重新校验，
 *     数据回来后平滑替换，不再闪「加载中」，切页/翻页不抖动；
 *   - 未命中：才进入 loading。
 * 缓存按 `cacheKey + JSON.stringify(deps)` 区分，零第三方依赖。
 */

interface CacheEntry<T> {
  data: T;
  ts: number;
}

const cacheStore = new Map<string, CacheEntry<unknown>>();

/** 手动清除全部请求缓存（如需） */
export function clearFetchCache(): void {
  cacheStore.clear();
}

export function useFetch<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
) {
  const key = `${cacheKey}#${JSON.stringify(deps)}`;
  const initial = cacheStore.get(key) as CacheEntry<T> | undefined;
  const [data, setData] = useState<T | null>(initial ? initial.data : null);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cached = cacheStore.get(key) as CacheEntry<T> | undefined;
    if (cached) {
      // 有缓存：先呈现旧数据，静默 revalidate，不进入 loading
      setData(cached.data);
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
    }

    fetcher()
      .then((d) => {
        if (cancelled) return;
        cacheStore.set(key, { data: d, ts: Date.now() });
        setData(d);
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // key 已包含 deps；fetcher 为每次渲染新建的闭包，不额外加入依赖
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, loading, error };
}
