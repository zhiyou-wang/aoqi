import type { CSSProperties, ReactNode } from 'react';
import { useLiquidDrag } from '../lib/useLiquidDrag';

interface LiquidButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  /** default：通透玻璃；primary：冷蓝 tint 玻璃；back：官方实心蓝胶囊 */
  variant?: 'default' | 'primary' | 'back';
  style?: CSSProperties;
  disabled?: boolean;
}

/**
 * 液态玻璃按钮（1:1 移植 kyant/backdrop LiquidButton）。
 * 按压放大、指尖光斑、拖拽水滴形变（斜向双轴 squash + 朝拖拽方向的有界
 * 磁吸微移、松手弹簧回位）全部收敛在 useLiquidDrag；本组件只负责玻璃
 * 外观（.aq-liquid-btn）与标签结构。
 */
export function LiquidButton({
  children,
  onClick,
  type = 'button',
  variant = 'default',
  style,
  disabled,
}: LiquidButtonProps) {
  const { ref, handlers } = useLiquidDrag<HTMLButtonElement>({ disabled, onClick });
  const variantClass =
    variant === 'primary'
      ? ' aq-liquid-btn--primary'
      : variant === 'back'
        ? ' aq-liquid-btn--back'
        : '';
  const sizeStyle =
    variant === 'back'
      ? { padding: '9px 18px', fontSize: 15 }
      : { padding: '13px 28px', fontSize: 16 };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={`aq-liquid-btn${variantClass}`}
      style={{ ...sizeStyle, ...style, opacity: disabled ? 0.5 : 1 }}
      {...handlers}
    >
      <span className="aq-liquid-btn__flash" aria-hidden="true" />
      <span className="aq-liquid-btn__spot" aria-hidden="true" />
      <span className="aq-liquid-btn__label">{children}</span>
    </button>
  );
}
