import { routePath, useHashRoute, navigate } from './lib/router';
import { SpiritsPage } from './pages/SpiritsPage';
import { SpiritDetailPage } from './pages/SpiritDetailPage';
import { SkinsPage } from './pages/SkinsPage';
import { BondsPage } from './pages/BondsPage';
import { RelationsPage } from './pages/RelationsPage';
import { GrowPage } from './pages/GrowPage';
import { HomePage } from './pages/HomePage';
import { GlassPanel } from './components/GlassPanel';
import type { SpiritSummary } from './shared';

/**
 * 应用路由（轻量 hash 路由）。
 * /             → 首页
 * /spirits      → 图鉴列表
 * /spirits/:id  → 精灵详情
 * /skins        → 皮肤库
 * /bonds        → 羁绊
 * /relations    → 关系图
 */
export default function App() {
  const path = routePath(useHashRoute());

  const detailMatch = path.match(/^\/spirits\/(\d+)$/);

  const navItems: Array<{ path: string; label: string }> = [
    { path: '/', label: '首页' },
    { path: '/spirits', label: '图鉴' },
    { path: '/skins', label: '皮肤' },
    { path: '/bonds', label: '羁绊' },
    { path: '/relations', label: '关系' },
    { path: '/grow', label: '养成' },
  ];

  function isActive(itemPath: string): boolean {
    if (itemPath === '/') return path === '/';
    if (itemPath === '/spirits') return path === '/spirits' || !!detailMatch;
    return path === itemPath;
  }

  function goDetail(spirit: SpiritSummary) {
    navigate(`/spirits/${spirit.race_id}`);
  }

  let page;
  if (detailMatch) {
    page = <SpiritDetailPage raceId={Number(detailMatch[1])} onBack={() => navigate('/spirits')} />;
  } else if (path === '/spirits') {
    page = <SpiritsPage onSelect={goDetail} />;
  } else if (path === '/skins') {
    page = <SkinsPage />;
  } else if (path === '/bonds') {
    page = <BondsPage />;
  } else if (path === '/relations') {
    page = <RelationsPage />;
  } else if (path === '/grow') {
    page = <GrowPage />;
  } else {
    page = <HomePage />;
  }

  return (
    <>
      {/* 场景背景层（冷色景深） */}
      <div className="aq-scene" aria-hidden="true">
        <div
          className="aq-scene__far"
          style={{
            position: 'absolute',
            right: '10vw',
            top: '6vh',
            width: '46vw',
            height: '50vh',
            borderRadius: '50%',
            background: 'radial-gradient(circle, oklch(0.55 0.10 230 / 0.30), transparent 65%)',
          }}
        />
        <div
          className="aq-scene__near"
          style={{
            position: 'absolute',
            left: '-8vw',
            bottom: '-18vh',
            width: '40vw',
            height: '46vh',
            borderRadius: '50%',
            background: 'radial-gradient(circle, oklch(0.45 0.12 265 / 0.28), transparent 65%)',
          }}
        />
      </div>
      <div className="aq-chromatic-edge" aria-hidden="true" />

      <div className="app-shell">
        <GlassPanel className="app-nav" radius={999}>
          <span className="app-nav__brand">AQ 图鉴</span>
          {navItems.map((item) => (
            <a
              key={item.path}
              className={`app-nav__link ${isActive(item.path) ? 'active' : ''}`}
              href={`#${item.path}`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </a>
          ))}
        </GlassPanel>

        {page}
      </div>
    </>
  );
}
