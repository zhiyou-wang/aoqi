import { useEffect, useRef } from 'react';
import type { PointerEvent as RPointerEvent, RefObject } from 'react';
import { Spring, SpringRunner } from './liquidSpring';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * 玻璃卡片的液态按压（官方 LiquidButton 的按压子集，不拖拽、不脱位）：
 * pointerdown 即刻按 4/高 有界鼓起（卡片较高，仅放大约 2~3%，克制），
 * 指尖一团加色光斑（CSS 变量 --card-spot-*，半径=短边·0.7，alpha=p），
 * 松手 spring 回弹。使用指针捕获，pointerup / pointercancel 结束按压。
 */
export interface LiquidPressHandlers<T extends HTMLElement> {
  onPointerDown: (e: RPointerEvent<T>) => void;
  onPointerMove: (e: RPointerEvent<T>) => void;
  onPointerUp: (e: RPointerEvent<T>) => void;
  onPointerCancel: (e: RPointerEvent<T>) => void;
}

export function useLiquidPress<T extends HTMLElement>(): {
  ref: RefObject<T>;
  handlers: LiquidPressHandlers<T>;
} {
  const ref = useRef<T>(null) as RefObject<T>;
  const spring = useRef(new Spring(0, { posEps: 0.001, velEps: 0.01 }));
  const st = useRef({ w: 0, h: 0, x: 0, y: 0, down: false });
  const runnerRef = useRef<SpringRunner | null>(null);

  if (!runnerRef.current) {
    runnerRef.current = new SpringRunner([spring.current], () => {
      const el = ref.current;
      if (!el) return;
      const s = st.current;
      const p = spring.current.value;
      if (p === 0) {
        // 归位：清空 inline transform，把外观交回 CSS
        el.style.transform = '';
        el.style.setProperty('--card-spot-a', '0');
        return;
      }
      const scale = 1 + (4 / (s.h || 1)) * p; // 官方按压放大 4dp / height
      el.style.transform = `scale(${scale.toFixed(4)})`;
      el.style.setProperty('--card-spot-a', p.toFixed(3));
      el.style.setProperty('--card-spot-x', `${s.x.toFixed(1)}px`);
      el.style.setProperty('--card-spot-y', `${s.y.toFixed(1)}px`);
    });
  }

  useEffect(() => () => runnerRef.current?.stop(), []);

  function measure(e: RPointerEvent<T>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const s = st.current;
    s.w = rect.width;
    s.h = rect.height;
    s.x = clamp(e.clientX - rect.left, 0, s.w);
    s.y = clamp(e.clientY - rect.top, 0, s.h);
    // 卡片较大，光斑只覆盖指尖附近（短边的 0.7）
    el.style.setProperty('--card-spot-r', `${(Math.min(s.w, s.h) * 0.7).toFixed(1)}px`);
  }

  function handleDown(e: RPointerEvent<T>) {
    const el = ref.current;
    if (!el) return;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* 某些指针类型不支持捕获，忽略 */
    }
    measure(e);
    st.current.down = true;
    spring.current.reset(0);
    spring.current.setTarget(1);
    el.classList.add('is-pressing');
    runnerRef.current?.start();
  }

  function handleMove(e: RPointerEvent<T>) {
    if (!st.current.down) return;
    measure(e);
    // 按住静止停振后再次移动：重启帧循环，让光斑继续跟手
    runnerRef.current?.start();
  }

  function release() {
    const el = ref.current;
    const s = st.current;
    if (!s.down || !el) return;
    s.down = false;
    spring.current.setTarget(0);
    el.classList.remove('is-pressing');
    runnerRef.current?.start();
  }

  return {
    ref,
    handlers: {
      onPointerDown: handleDown,
      onPointerMove: handleMove,
      onPointerUp: release,
      onPointerCancel: release,
    },
  };
}
