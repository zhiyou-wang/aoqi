import { useEffect, useRef } from 'react';
import type { PointerEvent as RPointerEvent, RefObject } from 'react';
import { Spring, SpringRunner } from './liquidSpring';

/* ============================================================
   1:1 移植自 kyant/backdrop 官方 LiquidButton（Compose）的液态手势，
   仅把渲染从 Skia 换成 DOM/CSS：
   - 手势：pointerdown 即刻 press（无移动阈值），拖动跟手，松手回弹；
   - 按压整体放大：scale 1 → 1 + 4dp/height · p；
   - 指尖亮斑：径向光斑白 0.22·p + 整面白 0.06·p（mix-blend: plus-lighter，
     半径=短边·1.2），光斑跟随指尖并钳在控件内；
   - 拖拽：按钮朝拖拽方向做有界磁吸微位移（tanh 饱和，不脱离原位、松手
     弹回），并沿拖拽方向分量做轴向形变（斜向时横纵两轴都增大）；
   - 拖拽超过 CLICK_SLOP 后松手吞掉 click，避免拖动误触发。
   ============================================================ */

// tanh 初始导数 0.05：越小，磁吸位移越黏、越克制
const DRAG_DERIVATIVE = 0.05;
// 仅用于区分“点击 / 拖拽”，不影响按压反馈
const CLICK_SLOP = 5;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

interface DragState {
  pointerId: number;
  w: number;
  h: number;
  minDim: number;
  startClientX: number;
  startClientY: number;
  startLX: number;
  startLY: number;
  moved: boolean;
}

export interface LiquidDragOptions {
  disabled?: boolean;
  onClick?: () => void;
  /** 按住时附加的 class，默认 is-active */
  activeClass?: string;
}

export interface LiquidDragHandlers<T extends HTMLElement> {
  onPointerDown: (e: RPointerEvent<T>) => void;
  onPointerMove: (e: RPointerEvent<T>) => void;
  onPointerUp: (e: RPointerEvent<T>) => void;
  onPointerCancel: (e: RPointerEvent<T>) => void;
  onClick: () => void;
}

export function useLiquidDrag<T extends HTMLElement>(
  opts: LiquidDragOptions = {},
): { ref: RefObject<T>; handlers: LiquidDragHandlers<T> } {
  const ref = useRef<T>(null) as RefObject<T>;
  // 按压进度（容差更紧）；拖拽偏移 x/y（容差更宽）——与原按钮逐轴一致
  const pSpring = useRef(new Spring(0, { posEps: 0.002, velEps: 0.02 }));
  const oxSpring = useRef(new Spring(0, { posEps: 0.15, velEps: 0.4 }));
  const oySpring = useRef(new Spring(0, { posEps: 0.15, velEps: 0.4 }));
  const st = useRef<DragState>({
    pointerId: -1, w: 0, h: 0, minDim: 0,
    startClientX: 0, startClientY: 0, startLX: 0, startLY: 0, moved: false,
  });
  const suppressClick = useRef(false);
  const cbRef = useRef(opts.onClick);
  cbRef.current = opts.onClick;
  const disabledRef = useRef(opts.disabled);
  disabledRef.current = opts.disabled;
  const activeClass = opts.activeClass ?? 'is-active';

  const runnerRef = useRef<SpringRunner | null>(null);
  if (!runnerRef.current) {
    runnerRef.current = new SpringRunner(
      [pSpring.current, oxSpring.current, oySpring.current],
      () => {
        const el = ref.current;
        if (!el) return;
        const s = st.current;
        const p = clamp01(pSpring.current.value);
        // —— 1:1 复刻 LiquidButton.layerBlock ——
        const width = s.w || 1;
        const height = s.h || 1;
        const d4 = 4 / height; // 4dp / height（按压与拖拽轴形变同一系数）
        const scale = 1 + d4 * p; // 按压整体放大
        const minDim = Math.min(width, height);
        const ox = oxSpring.current.value;
        const oy = oySpring.current.value;
        // 朝拖拽方向的有界磁吸微位移（tanh 饱和，不脱离原位，松手弹回）
        const tx = minDim * Math.tanh((DRAG_DERIVATIVE * ox) / minDim);
        const ty = minDim * Math.tanh((DRAG_DERIVATIVE * oy) / minDim);
        // 轴向形变：按拖拽方向分量作用，斜向时横纵两轴都增大
        const maxDim = Math.max(width, height);
        const ang = Math.atan2(oy, ox);
        const sx =
          scale +
          d4 * Math.abs((Math.cos(ang) * ox) / maxDim) * Math.min(width / height, 1);
        const sy =
          scale +
          d4 * Math.abs((Math.sin(ang) * oy) / maxDim) * Math.min(height / width, 1);

        el.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
        el.style.setProperty('--flash-a', (0.06 * p).toFixed(3));
        el.style.setProperty('--spot-a', (0.22 * p).toFixed(3));
        // 光斑跟随指尖（扣除按钮自身磁吸位移，使其始终贴在手指下方），钳在控件内
        const spotX = Math.min(width, Math.max(0, s.startLX + ox - tx));
        const spotY = Math.min(height, Math.max(0, s.startLY + oy - ty));
        el.style.setProperty('--spot-x', `${spotX.toFixed(1)}px`);
        el.style.setProperty('--spot-y', `${spotY.toFixed(1)}px`);
      },
    );
  }

  useEffect(() => () => runnerRef.current?.stop(), []);

  function handleDown(e: RPointerEvent<T>) {
    if (disabledRef.current) return;
    const el = ref.current;
    if (!el) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return; // 只响应主键
    const rect = el.getBoundingClientRect();
    const s = st.current;
    s.pointerId = e.pointerId;
    s.w = rect.width;
    s.h = rect.height;
    s.minDim = Math.min(rect.width, rect.height);
    s.startClientX = e.clientX;
    s.startClientY = e.clientY;
    s.startLX = e.clientX - rect.left;
    s.startLY = e.clientY - rect.top;
    s.moved = false;
    pSpring.current.reset(0);
    pSpring.current.setTarget(1); // pointerdown 即刻 press
    oxSpring.current.reset(0);
    oySpring.current.reset(0);
    el.style.setProperty('--spot-r', `${(s.minDim * 1.2).toFixed(1)}px`);
    el.classList.add(activeClass);
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    runnerRef.current?.start();
  }

  function handleMove(e: RPointerEvent<T>) {
    const s = st.current;
    if (s.pointerId !== e.pointerId) return;
    const dx = e.clientX - s.startClientX;
    const dy = e.clientY - s.startClientY;
    if (!s.moved && Math.hypot(dx, dy) > CLICK_SLOP) s.moved = true;
    oxSpring.current.setTarget(dx);
    oySpring.current.setTarget(dy);
    // 按住静止停振后再次拖拽：重启帧循环，让形变 / 光斑继续跟手
    runnerRef.current?.start();
  }

  function handleUp(e: RPointerEvent<T>) {
    const el = ref.current;
    const s = st.current;
    if (s.pointerId !== e.pointerId) return;
    s.pointerId = -1;
    pSpring.current.setTarget(0); // 松手：press 收回
    oxSpring.current.setTarget(0); // offset 弹簧回弹（光斑随之滑回并淡出）
    oySpring.current.setTarget(0);
    el?.classList.remove(activeClass);
    if (el) {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      runnerRef.current?.start();
    }
    if (s.moved) {
      // 拖拽松手不算点击：吞掉随后派发的 click
      suppressClick.current = true;
      setTimeout(() => {
        suppressClick.current = false;
      }, 0);
    }
  }

  function handleClick() {
    if (disabledRef.current) return;
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    cbRef.current?.();
  }

  return {
    ref,
    handlers: {
      onPointerDown: handleDown,
      onPointerMove: handleMove,
      onPointerUp: handleUp,
      onPointerCancel: handleUp,
      onClick: handleClick,
    },
  };
}
