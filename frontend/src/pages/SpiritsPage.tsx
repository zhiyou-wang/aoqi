import { useState } from 'react';
import { fetchFilters, fetchSpirits } from '../api/client';
import { useFetch } from '../lib/useFetch';
import { SpiritCard } from '../components/SpiritCard';
import { GlassPanel } from '../components/GlassPanel';
import type { SpiritSummary } from '../shared';

/**
 * 图鉴列表页：完整筛选（搜索/稀有度/元素/职业/时代/站位）+ 卡片网格 + 材质阶梯。
 */
export function SpiritsPage({ onSelect }: { onSelect?: (spirit: SpiritSummary) => void }) {
  const [q, setQ] = useState('');
  const [rarity, setRarity] = useState('');
  const [element, setElement] = useState('');
  const [era, setEra] = useState('');
  const [job, setJob] = useState('');
  const [position, setPosition] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);

  const { data: filters } = useFetch(fetchFilters, []);

  const { data: list, loading, error } = useFetch(
    () =>
      fetchSpirits({
        q: q || undefined,
        rarity: rarity ? Number(rarity) : undefined,
        element: element || undefined,
        era: era || undefined,
        job: job ? Number(job) : undefined,
        position: position || undefined,
        page,
        size: 24,
      }),
    [q, rarity, element, era, job, position, page],
  );

  const total = list?.meta?.total ?? 0;
  const pages = list?.meta?.pages ?? 0;

  return (
    <main>
      <GlassPanel className="dex-header">
        <h1>精灵图鉴</h1>
        <p>
          {loading ? '加载中…' : `共 ${total} 只精灵`} · 稀有度{' '}
          {filters?.data?.rarities.length ?? '—'} 档 · 职业 {filters?.data?.jobs.length ?? '—'} 种 ·
          元素 {filters?.data?.elements.length ?? '—'} 种
        </p>
      </GlassPanel>

      <GlassPanel className="filter-bar">
        <input
          className="filter-bar__search"
          type="search"
          placeholder="搜索精灵名字…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
        <select
          value={rarity}
          onChange={(e) => {
            setRarity(e.target.value);
            setPage(1);
          }}
        >
          <option value="">全部稀有度</option>
          {filters?.data?.rarities.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          value={element}
          onChange={(e) => {
            setElement(e.target.value);
            setPage(1);
          }}
        >
          <option value="">全部元素</option>
          {filters?.data?.elements.map((el) => (
            <option key={el.code} value={el.code}>
              {el.name}
            </option>
          ))}
        </select>
        <select
          value={job}
          onChange={(e) => {
            setJob(e.target.value);
            setPage(1);
          }}
        >
          <option value="">全部职业</option>
          {filters?.data?.jobs.map((j) => (
            <option key={j.code} value={j.code}>
              {j.name}
            </option>
          ))}
        </select>
        <select
          value={era}
          onChange={(e) => {
            setEra(e.target.value);
            setPage(1);
          }}
        >
          <option value="">全部时代</option>
          {filters?.data?.eras.map((er) => (
            <option key={er.code} value={er.code}>
              {er.name}
            </option>
          ))}
        </select>
        <select
          value={position}
          onChange={(e) => {
            setPosition(e.target.value);
            setPage(1);
          }}
        >
          <option value="">全部站位</option>
          {filters?.data?.positions.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </select>
      </GlassPanel>

      {error ? (
        <div className="state-hint">加载失败：{error}</div>
      ) : loading ? (
        <div className="state-hint">加载中…</div>
      ) : list?.data?.length ? (
        <div className="dex-grid">
          {list.data.map((spirit) => (
            <SpiritCard
              key={spirit.race_id}
              spirit={spirit}
              active={selected === spirit.race_id}
              onClick={() => {
                setSelected(spirit.race_id);
                onSelect?.(spirit);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="state-hint">没有匹配的精灵</div>
      )}

      {pages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            上一页
          </button>
          <span>
            第 {page} / {pages} 页
          </span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            下一页
          </button>
        </div>
      )}
    </main>
  );
}
