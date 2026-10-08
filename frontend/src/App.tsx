import { routePath, useHashRoute, navigate } from './lib/router';
import { SpiritsPage } from './pages/SpiritsPage';
import { SpiritDetailPage } from './pages/SpiritDetailPage';
import { HomePage } from './pages/HomePage';
import { GlassPanel } from './components/GlassPanel';
import type { SpiritSummary } from './shared';

/**
 * 应用路由（轻量 hash 路由）。
 * /             → 首页
 * /spirits      → 图鉴列表
 * /spirits/:id  → 精灵详情
 */
export default function App() {
  const path = routePath(useHashRoute());

  // 解析 /spirits/:id
  const detailMatch = path.match(/^\/spirits\/(\d+)$/);
  const isSpirits = path === '/spirits' || !!detailMatch;

  function goDetail(spirit: SpiritSummary) {
    navigate(`/spirits/${spirit.race_id}`);
  }

  let page;
  if (detailMatch) {
    page = <SpiritDetailPage raceId={Number(detailMatch[1])} onBack={() => navigate('/spirits')} />;
  } else if (path === '/spirits') {
    page = <SpiritsPage onSelect={goDetail} />;
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
          <a
            className={`app-nav__link ${path === '/' ? 'active' : ''}`}
            href="#/"
            onClick={() => navigate('/')}
          >
            首页
          </a>
          <a
            className={`app-nav__link ${isSpirits ? 'active' : ''}`}
            href="#/spirits"
            onClick={() => navigate('/spirits')}
          >
            图鉴
          </a>
        </GlassPanel>

        {page}
      </div>
    </>
  );
}
