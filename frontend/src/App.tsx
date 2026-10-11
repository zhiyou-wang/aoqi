import { useEffect, useRef } from 'react';
import { routePath, useHashRoute, navigate } from './lib/router';
import { SpiritsPage } from './pages/SpiritsPage';
import { SpiritDetailPage } from './pages/SpiritDetailPage';
import { SkinsPage } from './pages/SkinsPage';
import { RelationsPage } from './pages/RelationsPage';
import { GrowPage } from './pages/GrowPage';
import { HomePage } from './pages/HomePage';
import { GlassPanel } from './components/GlassPanel';
import { LiquidBottomTabs } from './components/LiquidBottomTabs';
import { WallpaperSwitcher } from './components/WallpaperSwitcher';
import { useWallpaper } from './lib/useWallpaper';
import type { BottomTabItem } from './components/LiquidBottomTabs';
import {
  HomeIcon,
  GridIcon,
  TagIcon,
  ShareIcon,
  SproutIcon,
} from './components/navIcons';
import type { SpiritSummary } from './shared';

/**
 * 应用路由（轻量 hash 路由）。
 * /             → 首页
 * /spirits      → 图鉴列表
 * /spirits/:id  → 精灵详情
 * /skins        → 皮肤库
 * /relations    → 关系图
 * /grow         → 养成
 */

const navTabs: BottomTabItem[] = [
  { key: '/', label: '首页', icon: <HomeIcon /> },
  { key: '/spirits', label: '图鉴', icon: <GridIcon /> },
  { key: '/skins', label: '皮肤', icon: <TagIcon /> },
  { key: '/relations', label: '关系', icon: <ShareIcon /> },
  { key: '/grow', label: '养成', icon: <SproutIcon /> },
];

export default function App() {
  const path = routePath(useHashRoute());
  const wallpaper = useWallpaper();

  // 切页回到顶部（瞬时），避免新页面停在旧滚动位置造成跳动
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [path]);

  // 悬浮滚动条：滚动中给根元素加 is-scrolling（滑块淡入），停止 700ms 后淡出；
  // 滑块几何随滚动比例更新，ResizeObserver 应对异步加载导致的高度变化
  const scrollThumbRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const thumb = scrollThumbRef.current!;
    let timer = 0;

    const update = () => {
      const vh = window.innerHeight;
      const sh = document.documentElement.scrollHeight;
      const scrollable = sh - vh;
      const thumbH = Math.max(28, (vh / sh) * vh);
      const maxTop = vh - thumbH;
      const top = scrollable > 0 ? (window.scrollY / scrollable) * maxTop : 0;
      thumb.style.height = `${thumbH}px`;
      thumb.style.top = `${top}px`;
    };

    const onScroll = () => {
      document.documentElement.classList.add('is-scrolling');
      window.clearTimeout(timer);
      timer = window.setTimeout(
        () => document.documentElement.classList.remove('is-scrolling'),
        700,
      );
      update();
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', update);
    const ro = new ResizeObserver(update);
    ro.observe(document.body);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', update);
      ro.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  const detailMatch = path.match(/^\/spirits\/(\d+)$/);

  // 当前高亮 tab（详情页归到图鉴）
  let navActiveIndex = 0;
  if (path === '/spirits' || detailMatch) navActiveIndex = 1;
  else if (path !== '/') {
    const i = navTabs.findIndex((t) => t.key !== '/' && path.startsWith(t.key));
    if (i >= 0) navActiveIndex = i;
  }

  function goDetail(spirit: SpiritSummary) {
    navigate(`/spirits/${spirit.race_id}`);
  }

  let page;
  if (detailMatch) {
    page = (
      <SpiritDetailPage
        raceId={Number(detailMatch[1])}
        onBack={() => navigate('/spirits')}
      />
    );
  } else if (path === '/spirits') {
    page = <SpiritsPage onSelect={goDetail} />;
  } else if (path === '/skins') {
    page = <SkinsPage />;
  } else if (path === '/relations') {
    page = <RelationsPage />;
  } else if (path === '/grow') {
    page = <GrowPage />;
  } else {
    page = <HomePage />;
  }

  return (
    <>
      {/* 场景背景层：壁纸可在左下角「更换壁纸」中切换（默认 hdiabpo4） */}
      <div className="aq-scene" aria-hidden="true">
        {wallpaper.bg?.type === 'video' ? (
          <video
            key={wallpaper.bg.key}
            className="aq-scene__media aq-scene__video"
            src={wallpaper.bg.src}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        ) : wallpaper.bg ? (
          <img
            key={wallpaper.bg.key}
            className="aq-scene__media aq-scene__img"
            src={wallpaper.bg.src}
            alt=""
          />
        ) : null}
      </div>

      {/* 悬浮白色液态玻璃滚动条：默认隐藏，滚动时淡入（几何由 JS 更新） */}
      <div className="aq-scrollbar" ref={scrollThumbRef} aria-hidden="true" />

      {/* 更换壁纸：左下角悬浮入口 */}
      <WallpaperSwitcher wallpaper={wallpaper} />

      <div className="app-shell">
        <GlassPanel className="app-nav" radius={999}>
          <span className="app-nav__brand">AQ 图鉴</span>
          <LiquidBottomTabs
            className="app-nav__tabs"
            items={navTabs}
            activeIndex={navActiveIndex}
            onSelect={(i) => navigate(navTabs[i].key)}
          />
        </GlassPanel>

        {page}
      </div>
    </>
  );
}
