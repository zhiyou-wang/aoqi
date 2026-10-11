import { describe, it, expect } from 'vitest';
import { routePath } from '../router';
import { rarityTone } from '../material';

describe('routePath', () => {
  it('空 hash 返回根路径', () => {
    expect(routePath('')).toBe('/');
  });

  it('去掉 # 前缀', () => {
    expect(routePath('#/spirits')).toBe('/spirits');
    expect(routePath('#/skins')).toBe('/skins');
    expect(routePath('#/grow')).toBe('/grow');
  });

  it('保留详情路径', () => {
    expect(routePath('#/spirits/10001')).toBe('/spirits/10001');
  });

  it('无 # 的 hash 原样返回', () => {
    expect(routePath('/bonds')).toBe('/bonds');
  });
});

describe('rarityTone 名字高亮色', () => {
  it('传说返回金色系（含 85 色相）', () => {
    expect(rarityTone(4)).toContain('85');
  });
  it('未知兜底初代灰', () => {
    expect(rarityTone(null)).toBe(rarityTone(1));
  });
});
