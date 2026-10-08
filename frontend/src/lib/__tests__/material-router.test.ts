import { describe, it, expect } from 'vitest';
import { routePath } from '../router';
import { rarityMaterial, rarityTone, gradeMaterial } from '../material';

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

describe('rarityMaterial 材质阶梯', () => {
  it('初代 → 哑光', () => {
    expect(rarityMaterial(1)).toBe('aq-matte');
  });
  it('幻兽 → 玻璃', () => {
    expect(rarityMaterial(2)).toBe('aq-glass');
  });
  it('超能 → 长虹', () => {
    expect(rarityMaterial(3)).toBe('aq-fluted');
  });
  it('传说 → 液态金属', () => {
    expect(rarityMaterial(4)).toBe('aq-metal');
  });
  it('未探明 → 磨砂', () => {
    expect(rarityMaterial(0)).toBe('aq-frosted');
  });
  it('未知 → 哑光兜底', () => {
    expect(rarityMaterial(null)).toBe('aq-matte');
    expect(rarityMaterial(undefined)).toBe('aq-matte');
    expect(rarityMaterial(99)).toBe('aq-matte');
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

describe('gradeMaterial 皮肤品级材质', () => {
  it('神话 → Y2K 铬', () => {
    expect(gradeMaterial('MYTH')).toBe('aq-y2k');
  });
  it('圣品 → 液态金属', () => {
    expect(gradeMaterial('HOLY')).toBe('aq-metal');
  });
  it('臻品 → 玻璃', () => {
    expect(gradeMaterial('PRIME')).toBe('aq-glass');
  });
  it('良品 → 哑光', () => {
    expect(gradeMaterial('GOOD')).toBe('aq-matte');
  });
  it('未知 → 哑光兜底', () => {
    expect(gradeMaterial(null)).toBe('aq-matte');
    expect(gradeMaterial('UNKNOWN')).toBe('aq-matte');
  });
});
