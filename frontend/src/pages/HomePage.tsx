import { GlassPanel } from '../components/GlassPanel';
import { LiquidButton } from '../components/LiquidButton';
import { navigate } from '../lib/router';

export function HomePage() {
  return (
    <main>
      <GlassPanel className="dex-header" style={{ padding: '48px 40px' }}>
        <p className="eyebrow" style={{ margin: '0 0 6px', color: 'var(--aq-muted)', fontSize: 13 }}>
          云端乐园 · 液态玻璃
        </p>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', letterSpacing: '-0.05em', margin: '0 0 14px' }}>
          精灵图鉴与养成系统
        </h1>
        <p style={{ color: 'var(--aq-muted)', fontSize: 16, maxWidth: '56ch', margin: '0 0 28px', lineHeight: 1.7 }}>
          以源核为中心，浏览精灵、皮肤、技能与羁绊。明亮的云端乐园动态美宣作为场景，液态玻璃承载信息与主行动，浮于画面最前。
        </p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <LiquidButton variant="primary" onClick={() => navigate('/spirits')}>
            进入图鉴
          </LiquidButton>
          <LiquidButton variant="default" onClick={() => navigate('/skins')}>
            查看皮肤
          </LiquidButton>
        </div>
      </GlassPanel>
    </main>
  );
}
