import { fetchGrowConfig } from '../api/client';
import { useFetch } from '../lib/useFetch';
import { GlassPanel } from '../components/GlassPanel';

const ERA_NAME: Record<string, string> = {
  BASE: '其他精灵',
  SHENQI: '神启精灵',
  SHENYAO: '神曜精灵',
  YUANQI: '源起精灵',
};

const CATEGORY_NAME: Record<string, string> = {
  SPIRIT: '精灵养成',
  COMMON: '公共养成',
  OTHER: '其他养成',
};

/**
 * 养成页：三类养成（精灵养成按类型继承+扩展、公共养成、其他养成）。
 * 数据字典来自后端，精灵养成实例数据当前为空（待抽取）。
 */
export function GrowPage() {
  const { data: config, loading } = useFetch(fetchGrowConfig, []);

  const items = config?.data?.items ?? [];
  const eraMap = config?.data?.era_map ?? {};

  const commonItems = items.filter((i) => i.category === 'COMMON');
  const otherItems = items.filter((i) => i.category === 'OTHER');
  const eraCodes = Object.keys(eraMap);

  return (
    <main>
      <GlassPanel className="dex-header">
        <h1>养成系统</h1>
        <p>
          {loading
            ? '加载中…'
            : `精灵养成（${eraCodes.length} 种类型）· 公共养成 ${commonItems.length} 项 · 其他养成 ${otherItems.length} 项`}
        </p>
      </GlassPanel>

      {loading ? (
        <div className="state-hint">加载中…</div>
      ) : (
        <>
          {/* 精灵养成：按类型 */}
          <GlassPanel className="detail-panel" style={{ marginBottom: 18 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>精灵养成（按精灵类型）</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {eraCodes.map((era) => (
                <div key={era} className="skill-item">
                  <div className="skill-item__head" style={{ marginBottom: 10 }}>
                    <span className="skill-item__name">{ERA_NAME[era] ?? era}</span>
                    <span className="skill-item__type">{eraMap[era].length} 项</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {eraMap[era].map((item) => (
                      <span key={item.grow_item_code} className="tag-pill">
                        {item.grow_item_name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* 公共养成 + 其他养成 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <GlassPanel className="detail-panel">
              <h2 style={{ margin: '0 0 14px', fontSize: 18 }}>公共养成（账号级）</h2>
              <div style={{ display: 'grid', gap: 8 }}>
                {commonItems.map((item) => (
                  <div key={item.grow_item_code} className="detail-row">
                    <span>{item.grow_item_name}</span>
                    <span style={{ color: 'var(--aq-muted)' }}>账号共享</span>
                  </div>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel className="detail-panel">
              <h2 style={{ margin: '0 0 14px', fontSize: 18 }}>其他养成</h2>
              <div style={{ display: 'grid', gap: 8 }}>
                {otherItems.map((item) => (
                  <div key={item.grow_item_code} className="detail-row">
                    <span>{item.grow_item_name}</span>
                    <span style={{ color: 'var(--aq-muted)' }}>{CATEGORY_NAME[item.category]}</span>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>

          <GlassPanel className="detail-panel" style={{ marginTop: 18 }}>
            <h2 style={{ margin: '0 0 10px', fontSize: 16 }}>说明</h2>
            <p style={{ margin: 0, color: 'var(--aq-muted)', fontSize: 13, lineHeight: 1.7 }}>
              精灵养成数据（等级数值、装备列表等）当前为空，表结构已就位，待从游戏配置中抽取。
              神启精灵额外有「神启神威」，神曜精灵额外有「神曜神格」，源起精灵的「源核」替代「潜能」。
            </p>
          </GlassPanel>
        </>
      )}
    </main>
  );
}
