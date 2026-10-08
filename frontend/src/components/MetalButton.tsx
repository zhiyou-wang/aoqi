import type { ReactNode } from 'react';

interface MetalButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
  disabled?: boolean;
}

/**
 * 液态金属主按钮：一屏唯一主行动。
 * 结构：容器（深底+文字）> 流动层 > 扫光 > 标签。
 * 低配友好：纯 CSS 动画，无 JS 位移场。
 */
export function MetalButton({ children, onClick, type = 'button', style, disabled }: MetalButtonProps) {
  return (
    <button
      type={type}
      className="aq-metal"
      onClick={onClick}
      disabled={disabled}
      style={{ padding: '14px 28px', fontSize: 16, ...style, opacity: disabled ? 0.5 : 1 }}
    >
      <span className="aq-metal__liquid" aria-hidden="true" />
      <span className="aq-metal__sheen" aria-hidden="true" />
      <span className="aq-metal__label">{children}</span>
    </button>
  );
}
