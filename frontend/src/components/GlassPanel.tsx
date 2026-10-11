import type { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  radius?: number;
  style?: React.CSSProperties;
}

/**
 * 玻璃面板：静态玻璃（aq-glass），承载信息。
 * 低配友好：只走 CSS backdrop-filter，不挂 SVG 折射滤镜。
 */
export function GlassPanel({ children, className = '', radius = 32, style }: GlassPanelProps) {
  return (
    <div
      className={`aq-glass ${className}`.trim()}
      style={{ borderRadius: radius, ...style }}
    >
      {children}
    </div>
  );
}
