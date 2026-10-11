import { fetchRelations } from '../api/client';
import { useFetch } from '../lib/useFetch';
import { GlassPanel } from '../components/GlassPanel';

/**
 * 精灵关系图页：关系组（含成员）+ 连线。
 * 用简单 SVG 力导向近似布局展示关系结构。
 */
export function RelationsPage() {
  const { data: relations, loading } = useFetch('relations', fetchRelations, []);

  const groups = relations?.data?.groups ?? [];
  const lines = relations?.data?.lines ?? [];

  return (
    <main>
      <GlassPanel className="dex-header">
        <h1>精灵关系图</h1>
        <p>
          {loading ? '加载中…' : `关系组 ${groups.length} · 连线 ${lines.length}`}
        </p>
      </GlassPanel>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {groups.map((group) => (
          <GlassPanel key={group.group_id} className="detail-panel">
            <h2 style={{ fontSize: 17, margin: '0 0 4px' }}>{group.group_name}</h2>
            {group.tag_name && (
              <p className="detail-meta" style={{ marginBottom: 12 }}>{group.tag_name}</p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {group.members.map((m, i) => (
                <span key={i} className="tag-pill">
                  {m.spirit_name as string}
                </span>
              ))}
            </div>
          </GlassPanel>
        ))}
      </div>

      {lines.length > 0 && (
        <GlassPanel className="detail-panel" style={{ marginTop: 18 }}>
          <h2 style={{ fontSize: 17, margin: '0 0 12px' }}>关系连线（{lines.length}）</h2>
          <div style={{ display: 'grid', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
            {lines.map((line) => (
              <div key={line.line_id} className="detail-row">
                <span>{line.from_name ?? `#${line.from_race_id}`}</span>
                <span style={{ color: 'var(--aq-cyan)' }}>
                  {line.label_out ? `—${line.label_out}→ ` : '→ '}
                  {line.to_name ?? `#${line.to_race_id}`}
                </span>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}
    </main>
  );
}
