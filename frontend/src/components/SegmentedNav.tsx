import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { SegItem } from './nav-types';

interface SegmentedNavProps {
  items: SegItem[];
  activeIndex: number;
  onSelect: (path: string) => void;
  /** 整行铺满、各项均分（用于面板内的分段 Tab）；默认 inline-flex（顶部导航） */
  block?: boolean;
}

const THUMB_SCALE = 1.3;
const DY_CLAMP = 10;

/**
 * 分段选择器：滑块玻璃质感完全由 CSS 提供（blur + 边缘高光，无 SVG
 * displacement），以保证快速连续点击时合成稳定、不丢文字；果冻形变
 * （--thumb-scale / --dy）在按压与拖拽时给出液态反馈。
 */
export function SegmentedNav({ items, activeIndex, onSelect, block = false }: SegmentedNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const [displayIndex, setDisplayIndex] = useState(activeIndex);

  const dragging = useRef(false);
  const clickMode = useRef(false);
  const glassTimer = useRef(0);
  const activeIndexRef = useRef(activeIndex);
  const internalNav = useRef(false);
  const firstRender = useRef(true);

  // ---------- 布局 ----------
  function itemLayout(index: number) {
    const seg = containerRef.current!;
    const item = itemRefs.current[index]!;
    const sr = seg.getBoundingClientRect();
    const ir = item.getBoundingClientRect();
    return {
      left: ir.left - sr.left,
      width: ir.width,
      center: ir.left + ir.width / 2,
    };
  }

  function snapTo(index: number, animate: boolean) {
    const ind = indicatorRef.current!;
    const l = itemLayout(index);
    if (!animate) ind.style.transition = 'none';
    ind.style.left = `${l.left}px`;
    ind.style.width = `${l.width}px`;
    if (!animate) {
      void ind.offsetHeight; // 强制回流，让 no-transition 生效
      ind.style.transition = '';
    }
    setDisplayIndex(index);
  }

  // 滑块以指针 X 为中心跟手，Y 小幅跟随（--dy，钳制 ±10）
  function moveIndicator(clientX: number, clientY: number) {
    const seg = containerRef.current!;
    const ind = indicatorRef.current!;
    const sr = seg.getBoundingClientRect();
    const indWidth = ind.getBoundingClientRect().width;
    const left = clientX - sr.left - indWidth / 2;
    const maxLeft = sr.width - ind.offsetWidth;
    ind.style.left = `${Math.max(0, Math.min(maxLeft, left))}px`;
    const dy = Math.max(
      -DY_CLAMP,
      Math.min(DY_CLAMP, clientY - (sr.top + sr.height / 2))
    );
    ind.style.setProperty('--dy', `${dy}px`);
  }

  function nearestItem(): number {
    const ind = indicatorRef.current!;
    const ir = ind.getBoundingClientRect();
    const center = ir.left + ir.width / 2;
    let best = 0;
    let bestDist = Infinity;
    items.forEach((_, i) => {
      const d = Math.abs(itemLayout(i).center - center);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  }

  function activateJelly() {
    const ind = indicatorRef.current!;
    ind.style.setProperty('--thumb-scale', String(THUMB_SCALE));
    ind.classList.add('jelly');
  }

  function deactivateJelly() {
    const ind = indicatorRef.current!;
    ind.classList.remove('jelly');
    ind.style.removeProperty('--dy');
  }

  // 点击切换：与 left/width 过渡同步结束后回弹；定时器兜底
  function scheduleSettle() {
    const ind = indicatorRef.current!;
    window.clearTimeout(glassTimer.current);
    let cleanup = () => {};
    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName !== 'left' && e.propertyName !== 'width') return;
      cleanup();
      deactivateJelly();
    };
    cleanup = () => {
      window.clearTimeout(glassTimer.current);
      ind.removeEventListener('transitionend', onEnd);
    };
    ind.addEventListener('transitionend', onEnd);
    glassTimer.current = window.setTimeout(() => {
      cleanup();
      deactivateJelly();
    }, 450);
  }

  // ---------- pointerdown（容器） ----------
  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    window.clearTimeout(glassTimer.current);
    const itemEl = (e.target as HTMLElement).closest(
      '.seg-nav__item'
    ) as HTMLButtonElement | null;
    const targetIndex = itemEl ? itemRefs.current.indexOf(itemEl) : -1;

    if (targetIndex >= 0 && targetIndex !== activeIndexRef.current) {
      // 点击其他项：果冻 + 滑动 + 导航
      clickMode.current = true;
      activateJelly();
      snapTo(targetIndex, true);
      internalNav.current = true;
      onSelect(items[targetIndex].path);
      scheduleSettle();
      return;
    }

    // 按住滑块 / 当前项：拖拽跟手
    dragging.current = true;
    containerRef.current!.classList.add('dragging');
    activateJelly();
    moveIndicator(e.clientX, e.clientY);
  }

  // ---------- window pointermove / up（绑定一次） ----------
  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!dragging.current) return;
      moveIndicator(e.clientX, e.clientY);
    }
    function onUp() {
      if (clickMode.current) {
        clickMode.current = false;
        return;
      }
      if (!dragging.current) return;
      dragging.current = false;
      containerRef.current?.classList.remove('dragging');
      const target = nearestItem();
      // 松手：滑块平滑吸附到最近项，果冻缩回与滑动并行收尾
      snapTo(target, true);
      deactivateJelly();
      if (target !== activeIndexRef.current) {
        internalNav.current = true;
        onSelect(items[target].path);
      }
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.clearTimeout(glassTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, onSelect]);

  // ---------- 首次挂载：定位 ----------
  useLayoutEffect(() => {
    const ind = indicatorRef.current!;
    ind.style.transition = 'none';
    const l = itemLayout(activeIndex);
    ind.style.left = `${l.left}px`;
    ind.style.width = `${l.width}px`;
    void ind.offsetHeight;
    ind.style.transition = '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- activeIndex prop 同步（外部路由） ----------
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      activeIndexRef.current = activeIndex;
      return;
    }
    if (activeIndex === activeIndexRef.current) return;
    activeIndexRef.current = activeIndex;
    if (internalNav.current) {
      // 本组件触发的导航：滑块已命令式处理，无需再动
      internalNav.current = false;
      return;
    }
    // 外部路由变化（浏览器前进/后退）：滑动到新项
    activateJelly();
    snapTo(activeIndex, true);
    scheduleSettle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  return (
    <div
      className={`seg-nav${block ? ' seg-nav--block' : ''}`}
      ref={containerRef}
      onPointerDown={handlePointerDown}
    >
      <span className="seg-nav__indicator" ref={indicatorRef} aria-hidden="true" />
      {items.map((it, i) => (
        <button
          key={it.path}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
          type="button"
          className={`seg-nav__item ${i === displayIndex ? 'active' : ''}`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
