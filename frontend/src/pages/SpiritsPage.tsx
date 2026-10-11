import { useState } from 'react';
import { fetchFilters, fetchSpirits } from '../api/client';
import { useFetch } from '../lib/useFetch';
import { SpiritCard } from '../components/SpiritCard';
import { GlassPanel } from '../components/GlassPanel';
import { Pagination } from '../components/Pagination';
import { FilterSearch, FilterSelect } from '../components/FilterControls';
import type { SpiritSummary } from '../shared';

/**
 * 图鉴列表页：完整筛选（搜索/稀有度/元素/职业/时代/站位）+ 卡片网格。
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

  const { data: filters } = useFetch('filters', fetchFilters, []);

  const { data: list, loading, error } = useFetch(
    'spirits',
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
  const resetPage = () => setPage(1);

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
        <FilterSearch
          value={q}
          placeholder="搜索精灵名字…"
          onChange={(v) => {
            setQ(v);
            resetPage();
          }}
        />
        <FilterSelect
          value={rarity}
          allLabel="全部稀有度"
          options={filters?.data?.rarities}
          onChange={(v) => {
            setRarity(v);
            resetPage();
          }}
        />
        <FilterSelect
          value={element}
          allLabel="全部元素"
          options={filters?.data?.elements}
          onChange={(v) => {
            setElement(v);
            resetPage();
          }}
        />
        <FilterSelect
          value={job}
          allLabel="全部职业"
          options={filters?.data?.jobs}
          onChange={(v) => {
            setJob(v);
            resetPage();
          }}
        />
        <FilterSelect
          value={era}
          allLabel="全部时代"
          options={filters?.data?.eras}
          onChange={(v) => {
            setEra(v);
            resetPage();
          }}
        />
        <FilterSelect
          value={position}
          allLabel="全部站位"
          options={filters?.data?.positions}
          onChange={(v) => {
            setPosition(v);
            resetPage();
          }}
        />
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

      <Pagination page={page} pages={pages} onChange={setPage} />
    </main>
  );
}
