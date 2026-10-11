import type { ReactNode } from 'react';

/**
 * 主导航图标集（零依赖，内联 SVG）。
 * 统一 24×24 线性描边、圆角端点，风格对齐 Apple SF Symbols。
 * 图标使用 currentColor，由父级控制颜色（选中蓝 / 未选中深色）。
 */

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="100%"
      height="100%"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** 首页：房子 */
export const HomeIcon = () => (
  <Svg>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
    <path d="M9.5 21v-6h5v6" />
  </Svg>
);

/** 图鉴：四宫格 */
export const GridIcon = () => (
  <Svg>
    <rect x="3" y="3" width="7" height="7" rx="1.6" />
    <rect x="14" y="3" width="7" height="7" rx="1.6" />
    <rect x="3" y="14" width="7" height="7" rx="1.6" />
    <rect x="14" y="14" width="7" height="7" rx="1.6" />
  </Svg>
);

/** 皮肤：吊牌 */
export const TagIcon = () => (
  <Svg>
    <path d="M3 11V4a1 1 0 0 1 1-1h7l9 9-8 8-9-9Z" />
    <circle cx="7.5" cy="7.5" r="1.3" />
  </Svg>
);

/** 关系：分享节点 */
export const ShareIcon = () => (
  <Svg>
    <circle cx="6" cy="12" r="2.4" />
    <circle cx="18" cy="6" r="2.4" />
    <circle cx="18" cy="18" r="2.4" />
    <path d="M8.2 10.8 15.8 7.2" />
    <path d="M8.2 13.2l7.6 3.6" />
  </Svg>
);

/** 养成：幼苗 */
export const SproutIcon = () => (
  <Svg>
    <path d="M12 21v-8" />
    <path d="M12 13C12 9 9 7 5 7c0 4 3 6 7 6Z" />
    <path d="M12 11c0-3 2.5-5 6-5 0 3.5-2.5 5-6 5Z" />
  </Svg>
);
