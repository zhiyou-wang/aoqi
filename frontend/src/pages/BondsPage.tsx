import { useState } from 'react';
import { fetchBonds } from '../api/client';
import { useFetch } from '../lib/useFetch';
import { GlassPanel } from '../components/GlassPanel';

/**
 * 羁绊页：上阵羁绊 + 收集羁绊 两套。
 */
export function BondsPage() {
  const [view, setView] = useState<'form' | 'collect'>('form');
  const { data: bonds, loading } = useFetch(fetchBonds, []);

  const forms = bonds?.data?.forms ?? [];
  const collects = bonds?.data?.collects ?? [];

  return (
    <main>
      <GlassPanel className="dex-header">
        <h1>羁绊</h1>
        <p>
          {loading ? '加载中…' : `上阵羁绊 ${forms.length} · 收集羁绊 ${collects.length}`}
        </p>
      </GlassPanel>

      <GlassPanel className="detail-panel" style={{ marginBottom: 18 }}>
        <div className="tabs">
          <button className={view === 'form' ? 'active' : ''} onClick={() => setView('form')}>
            上阵羁绊 ({forms.length})
          </button>
          <button className={view === 'collect' ? 'active' : ''} onClick={() => setView('collect')}>
            收集羁绊 ({collects.length})
          </button>
        </div>

        {loading ? (
          <div className="state-hint">加载中…</div>
        ) : view === 'form' ? (
          <div style={{ display: 'grid', gap: 12 }}>
            {forms.map((f) => (
              <div key={f.race_id} className="skill-item">
                <div className="skill-item__head">
                  <span className="skill-item__name">{f.spirit_name ?? `#${f.race_id}`}</span>
                  {f.bond_name && <span className="skill-item__slot">{f.bond_name}</span>}
                </div>
                {f.members.length > 0 && (
                  <p className="skill-item__desc" style={{ marginTop: 6 }}>
                    成员：{f.members.map((m) => m.member_name as string).join('、')}
                  </p>
                )}
                {f.effect_desc && (
                  <p className="skill-item__desc">{f.effect_desc}</p>
                )}
              </div>
            ))}
            {forms.length === 0 && <div className="state-hint">暂无上阵羁绊</div>}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {collects.map((c) => (
              <div key={c.bond_id} className="skill-item">
                <div className="skill-item__head">
                  <span className="skill-item__name">{c.spirit_name ?? '?'}</span>
                  {c.partner_name && <span className="skill-item__type">+ {c.partner_name}</span>}
                </div>
                {c.bond_name && (
                  <p className="skill-item__desc" style={{ marginTop: 4 }}>
                    <b>{c.bond_name}</b>
                  </p>
                )}
                {c.effect_desc && <p className="skill-item__desc">{c.effect_desc}</p>}
              </div>
            ))}
            {collects.length === 0 && <div className="state-hint">暂无收集羁绊</div>}
          </div>
        )}
      </GlassPanel>
    </main>
  );
}
