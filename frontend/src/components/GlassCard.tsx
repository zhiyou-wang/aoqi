import type { CSSProperties, KeyboardEvent as RKeyboardEvent, ReactNode } from 'react';
import { useLiquidPress } from '../lib/useLiquidPress';

interface GlassCardProps {
  children: ReactNode;
  /** 传入 onClick 后卡片可点击（指针 + 键盘），并获得液态按压反馈 */
  onClick?: () => void;
  active?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * 通用液态玻璃卡片壳：spirit-card aq-glass 轮廓 + 指尖光斑层 +
 * 单轴按压缩放（useLiquidPress）。精灵卡 / 皮肤卡共用，保证按压手感一致。
 */
export function GlassCard({ children, onClick, active, className = '', style }: GlassCardProps) {
  const { ref, handlers } = useLiquidPress<HTMLElement>();

  function handleKeyDown(e: RKeyboardEvent<HTMLElement>) {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  }

  return (
    <article
      ref={ref}
      className={`spirit-card aq-glass${active ? ' active' : ''}${className ? ` ${className}` : ''}`}
      style={{ cursor: onClick ? 'pointer' : 'default', ...style }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      {...handlers}
    >
      <span className="spirit-card__spot" aria-hidden="true" />
      {children}
    </article>
  );
}
