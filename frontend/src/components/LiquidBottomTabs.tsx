import { useEffect, useLayoutEffect, useRef } from 'react';
import type {
  ReactNode,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from 'react';
import { Spring } from '../lib/liquidSpring';

export interface BottomTabItem {
  key: string;
  label: string;
  icon: ReactNode;
}

interface LiquidBottomTabsProps {
  items: BottomTabItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}

/* —— 物理/视觉常量（对齐官方 kyant LiquidBottomTabs，幅度克制）—— */
const SLOP = 6; // 区分点击 / 拖拽
const PRESS_SCALE = 78 / 56; // 滑块按压整体放大（官方 pressedScale）
const ICON_SCALE = 1.1; // tab 图标按压放大（官方 lerp(1, 1+16/width, p)）
const PANEL_PX = 4; // 面板橡皮筋最大位移（官方 4dp）

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

/**
 * React 版官方 LiquidBottomTabs：
 * 图标 + 文字纵向排列，选中态染蓝；液态滑块支持
 * 点击滑动 / 按住拖拽跟手，按压放大、速度驱动 squash/stretch，
 * 整个面板朝拖拽方向橡皮筋微移，松手弹簧吸附归位。
 */
export function LiquidBottomTabs({
  items,
  activeIndex,
  onSelect,
  className,
}: LiquidBottomTabsProps) {
  const n = items.length;
  const trackRef = useRef<HTMLDivElement>(null) as RefObject<HTMLDivElement>;
  const thumbRef = useRef<HTMLDivElement>(null) as RefObject<HTMLDivElement>;
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const press = useRef(new Spring(0));
  const val = useRef(new Spring(clamp(activeIndex, 0, Math.max(0, n - 1))));
  const panel = useRef(new Spring(0));

  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const lastTRef = useRef(0);
  const lastValRef = useRef(val.current.value);

  const g = useRef({
    active: false,
    dragging: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    startVal: 0,
    hit: 0,
  });

  const activeRef = useRef(activeIndex);
  activeRef.current = activeIndex;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  /* 外部 activeIndex 变化 → 滑块目标跟随 */
  useEffect(() => {
    val.current.target = clamp(activeIndex, 0, Math.max(0, n - 1));
    kick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, n]);

  /* 卸载（含 StrictMode 重挂）时停止循环并复位运行标志，避免 rAF 被
     cleanup 取消后 running 卡在 true、之后 kick() 不再启动（滑块假死） */
  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      runningRef.current = false;
      lastTRef.current = 0;
    },
    [],
  );

  /* 初始：首帧定位（玻璃质感由 CSS 提供） */
  useLayoutEffect(() => {
    renderFrame(1 / 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function renderFrame(dt: number) {
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return;
    const trackW = track.clientWidth;
    const tabW = trackW / n;
    const v = val.current.value;
    const p = press.current.value;
    const pv = panel.current.value;

    const vel = dt > 0 ? (v - lastValRef.current) / dt : 0; // tab/s
    lastValRef.current = v;
    // 官方 velocity = value 速率/(n-1)，再 /10；系数先乘后 clamp
    const v10 = vel / (10 * Math.max(1, n - 1));
    const kx = clamp(v10 * 0.75, -0.2, 0.2);
    const ky = clamp(v10 * 0.25, -0.2, 0.2);
    // 基础按压放大（scaleX/Y 同一 pressedScale），再叠加速度水滴形变
    const ps = 1 + (PRESS_SCALE - 1) * p;
    const sx = ps / (1 - kx);
    const sy = ps * (1 - ky);
    thumb.style.width = `${tabW.toFixed(2)}px`;
    thumb.style.transform = `translateX(${(v * tabW).toFixed(2)}px) scale(${sx
      .toFixed(4)},${sy.toFixed(4)})`;
    // 按压态：thumb 透镜化、track 按压反馈（CSS 消费 is-pressing）
    const pressing = p > 0.03;
    thumb.classList.toggle('is-pressing', pressing);
    track.classList.toggle('is-pressing', pressing);

    // 面板橡皮筋
    const fr = clamp(pv / trackW, -1, 1);
    const off = PANEL_PX * Math.sign(fr) * easeOutCubic(Math.abs(fr));
    track.style.transform = `translateX(${off.toFixed(2)}px)`;

    // tab 高亮跟随滑块；选中 tab 图标随按压放大
    const hi = clamp(Math.round(v), 0, n - 1);
    for (let i = 0; i < n; i++) {
      const tab = tabRefs.current[i];
      if (!tab) continue;
      const isHi = i === hi;
      tab.classList.toggle('is-active', isHi);
      const ic = tab.firstElementChild as HTMLElement | null;
      if (ic) {
        const s = isHi ? 1 + (ICON_SCALE - 1) * p : 1;
        ic.style.transform = `scale(${s.toFixed(4)})`;
      }
    }
  }

  function frame(now: number) {
    const dt = lastTRef.current
      ? clamp((now - lastTRef.current) / 1000, 0.001, 0.05)
      : 1 / 60;
    lastTRef.current = now;
    press.current.step(dt);
    val.current.step(dt);
    panel.current.step(dt);
    renderFrame(dt);

    const done =
      press.current.settled &&
      val.current.settled &&
      panel.current.settled &&
      !g.current.active;
    if (done) {
      press.current.snapToTarget();
      val.current.snapToTarget();
      panel.current.snapToTarget();
      renderFrame(1 / 60);
      runningRef.current = false;
      rafRef.current = 0;
      lastTRef.current = 0;
      return;
    }
    rafRef.current = requestAnimationFrame(frame);
  }

  function kick() {
    if (runningRef.current) return;
    runningRef.current = true;
    lastTRef.current = 0;
    rafRef.current = requestAnimationFrame(frame);
  }

  function onDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const tabW = rect.width / n;
    g.current.active = true;
    g.current.dragging = false;
    g.current.pointerId = e.pointerId;
    g.current.startX = e.clientX;
    g.current.startY = e.clientY;
    g.current.startVal = val.current.value;
    g.current.hit = clamp(
      Math.floor((e.clientX - rect.left) / tabW),
      0,
      n - 1,
    );
    press.current.target = 1;
    track.setPointerCapture(e.pointerId);
    kick();
  }

  function onMove(e: ReactPointerEvent<HTMLDivElement>) {
    const st = g.current;
    if (!st.active || e.pointerId !== st.pointerId) return;
    const track = trackRef.current;
    if (!track) return;
    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    if (!st.dragging && Math.hypot(dx, dy) > SLOP) st.dragging = true;
    if (st.dragging) {
      const tabW = track.clientWidth / n;
      val.current.target = clamp(st.startVal + dx / tabW, 0, n - 1);
      panel.current.target = dx;
      kick();
    }
  }

  function onUp(e: ReactPointerEvent<HTMLDivElement>) {
    const st = g.current;
    if (!st.active || e.pointerId !== st.pointerId) return;
    st.active = false;
    press.current.target = 0;
    panel.current.target = 0;
    if (st.dragging) {
      const t = clamp(Math.round(val.current.value), 0, n - 1);
      val.current.target = t;
      if (t !== activeRef.current) onSelectRef.current(t);
    } else {
      const h = st.hit;
      val.current.target = h;
      if (h !== activeRef.current) onSelectRef.current(h);
    }
    st.dragging = false;
    kick();
  }

  function onTabClick(i: number) {
    // 键盘/辅助点击：指针操作已在 onUp 处理
    if (g.current.active) return;
    if (i !== activeRef.current) onSelectRef.current(i);
    else {
      val.current.target = i;
      kick();
    }
  }

  return (
    <div
      ref={trackRef}
      className={`lbt ${className ?? ''}`}
      role="tablist"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <div ref={thumbRef} className="lbt__thumb" aria-hidden="true" />
      {items.map((it, i) => (
        <button
          key={it.key}
          ref={(el) => {
            tabRefs.current[i] = el;
          }}
          type="button"
          role="tab"
          aria-selected={i === activeIndex}
          className="lbt__tab"
          onClick={() => onTabClick(i)}
          tabIndex={0}
        >
          <span className="lbt__icon">{it.icon}</span>
          <span className="lbt__label">{it.label}</span>
        </button>
      ))}
    </div>
  );
}
