import { useState } from 'react';
import { fetchSkins, fetchSkinGrades } from '../api/client';
import { useFetch } from '../lib/useFetch';
import { GlassPanel } from '../components/GlassPanel';
import { GlassCard } from '../components/GlassCard';
import { Pagination } from '../components/Pagination';
import { FilterSelect } from '../components/FilterControls';

/**
 * 皮肤库页：品级筛选 + 卡片网格，卡片统一为液态玻璃（GlassCard）。
 */
export function SkinsPage() {
  const [grade, setGrade] = useState('');
  const [page, setPage] = useState(1);

  const { data: grades } = useFetch('skin-grades', fetchSkinGrades, []);
  const { data: list, loading } = useFetch(
    'skins',
    () => fetchSkins({ grade: grade || undefined, page, size: 24 }),
    [grade, page],
  );

  const gradeOptions = grades?.data?.map((g) => ({ code: g.grade_code, name: g.grade_name }));

  return (
    <main>
      <GlassPanel className="dex-header">
        <h1>皮肤库</h1>
        <p>
          {loading ? '加载中…' : `共 ${list?.meta?.total ?? '—'} 件皮肤`} · {grades?.data?.length ?? '—'} 档品级
        </p>
      </GlassPanel>

      <GlassPanel className="filter-bar">
        <FilterSelect
          value={grade}
          allLabel="全部品级"
          options={gradeOptions}
          onChange={(v) => {
            setGrade(v);
            setPage(1);
          }}
        />
      </GlassPanel>

      {loading ? (
        <div className="state-hint">加载中…</div>
      ) : (
        <div className="dex-grid">
          {list?.data?.map((skin) => (
            <GlassCard key={skin.skin_id} style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--aq-muted)' }}>
                  {skin.grade_name ?? '普通'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--aq-muted)' }}>#{skin.skin_id}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{skin.skin_name}</div>
              <div style={{ fontSize: 12, color: 'var(--aq-muted)' }}>
                {skin.wear_count} 个形态可穿戴
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <Pagination page={page} pages={list?.meta?.pages ?? 0} onChange={setPage} />
    </main>
  );
}
