import { useEffect, useState } from 'react';

/**
 * 轻量 hash 路由（替代 react-router-dom）。
 *
 * 只有两三个页面，用 URL hash 判断当前页即可，零依赖。
 */

export function useHashRoute(): string {
  const [hash, setHash] = useState(() => window.location.hash || '#/');

  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return hash;
}

/** 编程式导航：navigate('/spirits') */
export function navigate(path: string) {
  window.location.hash = path;
}

/** 当前路由 path 部分，例如 '#/spirits' -> '/spirits' */
export function routePath(hash: string): string {
  return hash.replace(/^#/, '') || '/';
}
