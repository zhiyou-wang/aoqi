/**
 * 稀有度视觉配色（用于名字 / 徽章高亮）。
 * 全站只有液态玻璃一种材质，稀有度 / 品级仅通过文字颜色区分。
 */

/** 稀有度 code → 徽章 / 名字配色 */
const RARITY_TONE: Record<number, string> = {
  1: 'oklch(0.72 0.03 225)',   // 初代：冷灰
  2: 'oklch(0.80 0.10 205)',   // 幻兽：青
  3: 'oklch(0.78 0.10 175)',   // 超能：薄荷
  4: 'oklch(0.90 0.10 85)',    // 传说：金
  0: 'oklch(0.60 0.02 230)',   // 未探明：暗灰
};

export function rarityTone(code: number | null | undefined): string {
  if (code == null) return RARITY_TONE[1];
  return RARITY_TONE[code] ?? RARITY_TONE[1];
}
