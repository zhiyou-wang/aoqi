import { GlassPanel } from '../components/GlassPanel';
import { MetalButton } from '../components/MetalButton';
import { navigate } from '../lib/router';

export function HomePage() {
  return (
    <main>
      <GlassPanel className="dex-header" style={{ padding: '48px 40px' }}>
        <p className="eyebrow" style={{ margin: '0 0 6px', color: 'var(--aq-muted)', fontSize: 13 }}>
          冷色神迹工艺
        </p>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', letterSpacing: '-0.05em', margin: '0 0 14px' }}>
          精灵图鉴与养成系统
        </h1>
        <p style={{ color: 'oklch(0.82 0.03 225)', fontSize: 16, maxWidth: '56ch', margin: '0 0 28px', lineHeight: 1.7 }}>
          以源核为中心，浏览精灵、皮肤、技能与羁绊。场景层保持低饱和冷色与景深，玻璃层承载信息，唯一的液态金属主行动浮在最前。
        </p>
        <MetalButton onClick={() => navigate('/spirits')}>进入图鉴</MetalButton>
      </GlassPanel>
    </main>
  );
}
