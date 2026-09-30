import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { fetchFilters, fetchSpirits } from '../api/client';

/**
 * 图鉴列表页（M1 最小验证版）。
 * 通过 TanStack Query 拉取后端数据，验证前后端数据通道。
 * 后续在此页上叠加完整筛选、虚拟滚动与设计系统。
 */
export function SpiritsPage() {
  const [page, setPage] = useState(1);
  const { data: filters } = useQuery({
    queryKey: ['spirits', 'filters'],
    queryFn: fetchFilters,
  });

  const { data: list } = useQuery({
    queryKey: ['spirits', page],
    queryFn: () => fetchSpirits({ page, size: 20 }),
  });

  return (
    <main style={{ padding: 24, color: '#ccc', fontFamily: 'sans-serif' }}>
      <h1>精灵图鉴</h1>
      <p>
        共 {list?.meta.total ?? '—'} 只 · 稀有度 {filters?.data.rarities.length ?? '—'} 档 ·
        职业 {filters?.data.jobs.length ?? '—'} 种
      </p>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
            <th style={{ textAlign: 'left', padding: 8 }}>名字</th>
            <th style={{ textAlign: 'left', padding: 8 }}>稀有度</th>
            <th style={{ textAlign: 'left', padding: 8 }}>站位</th>
            <th style={{ textAlign: 'left', padding: 8 }}>职业</th>
          </tr>
        </thead>
        <tbody>
          {list?.data.map((s) => (
            <tr key={s.race_id}>
              <td style={{ padding: 8 }}>{s.race_id}</td>
              <td style={{ padding: 8 }}>{s.spirit_name}</td>
              <td style={{ padding: 8 }}>{s.rarity_name}</td>
              <td style={{ padding: 8 }}>{s.position_name}</td>
              <td style={{ padding: 8 }}>{s.jobs.join('、')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
          上一页
        </button>
        <span>第 {page} 页</span>
        <button onClick={() => setPage((p) => p + 1)}>下一页</button>
      </div>
    </main>
  );
}
