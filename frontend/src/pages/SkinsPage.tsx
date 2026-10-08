import { useState } from 'react';
import { fetchSkins, fetchSkinGrades } from '../api/client';
import { useFetch } from '../lib/useFetch';
import { GlassPanel } from '../components/GlassPanel';
import { gradeMaterial } from '../lib/material';

/**
 * 皮肤库页：品级筛选 + 卡片网格，品级用材质阶梯表达。
 */
export function SkinsPage() {
  const [grade, setGrade] = useState('');
  const [page, setPage] = useState(1);

  const { data: grades } = useFetch(fetchSkinGrades, []);
  const { data: list, loading } = useFetch(
    () => fetchSkins({ grade: grade || undefined, page, size: 24 }),
    [grade, page],
  );

  return (
    <main>
      <GlassPanel className="dex-header">
        <h1>皮肤库</h1>
        <p>
          {loading ? '加载中…' : `共 ${list?.meta?.total ?? '—'} 件皮肤`} · {grades?.data?.length ?? '—'} 档品级
        </p>
      </GlassPanel>

      <GlassPanel className="filter-bar">
        <select
          value={grade}
          onChange={(e) => {
            setGrade(e.target.value);
            setPage(1);
          }}
        >
          <option value="">全部品级</option>
          {grades?.data?.map((g) => (
            <option key={g.grade_code} value={g.grade_code}>
              {g.grade_name}
            </option>
          ))}
        </select>
      </GlassPanel>

      {loading ? (
        <div className="state-hint">加载中…</div>
      ) : (
        <div className="dex-grid">
          {list?.data?.map((skin) => (
            <article
              key={skin.skin_id}
              className={`spirit-card ${gradeMaterial(skin.grade_code)}`}
              style={{ borderRadius: 24, padding: 16 }}
            >
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
            </article>
          ))}
        </div>
      )}

      {list?.meta && list.meta.pages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>上一页</button>
          <span>第 {page} / {list.meta.pages} 页</span>
          <button disabled={page >= list.meta.pages} onClick={() => setPage((p) => p + 1)}>下一页</button>
        </div>
      )}
    </main>
  );
}
