/**
 * 材质阶梯映射：稀有度/品级 → 材质类（CSS class）。
 *
 * 对应后端 /material-config 的材质阶梯（冷色神迹工艺）。
 * 稀有度：初代→matte、幻兽→glass、超能→fluted、传说→metal、未探明→frosted
 * 皮肤品级：良品→matte、精品→matte+rim、臻品→glass、绝品→fluted、
 *           性转→glass+dispersion、圣品→metal、神话→chrome
 */

export type MaterialClass =
  | 'aq-matte'
  | 'aq-glass'
  | 'aq-fluted'
  | 'aq-metal'
  | 'aq-y2k'
  | 'aq-frosted';

/** 稀有度 code → 材质类 */
const RARITY_MATERIAL: Record<number, MaterialClass> = {
  1: 'aq-matte',    // 初代
  2: 'aq-glass',    // 幻兽
  3: 'aq-fluted',   // 超能
  4: 'aq-metal',    // 传说
  0: 'aq-frosted',  // 未探明
};

/** 稀有度 code → 徽章配色（用于名字高亮） */
const RARITY_TONE: Record<number, string> = {
  1: 'oklch(0.72 0.03 225)',   // 初代：冷灰
  2: 'oklch(0.80 0.10 205)',   // 幻兽：青
  3: 'oklch(0.78 0.10 175)',   // 超能：薄荷
  4: 'oklch(0.90 0.10 85)',    // 传说：金
  0: 'oklch(0.60 0.02 230)',   // 未探明：暗灰
};

/** 皮肤品级 code → 材质类 */
const GRADE_MATERIAL: Record<string, MaterialClass> = {
  GOOD: 'aq-matte',       // 良品
  FINE: 'aq-matte',       // 精品
  PRIME: 'aq-glass',      // 臻品
  EXQUISITE: 'aq-fluted', // 绝品
  GENDER: 'aq-glass',     // 性转
  HOLY: 'aq-metal',       // 圣品
  MYTH: 'aq-y2k',         // 神话
};

export function rarityMaterial(code: number | null | undefined): MaterialClass {
  if (code == null) return 'aq-matte';
  return RARITY_MATERIAL[code] ?? 'aq-matte';
}

export function rarityTone(code: number | null | undefined): string {
  if (code == null) return RARITY_TONE[1];
  return RARITY_TONE[code] ?? RARITY_TONE[1];
}

export function gradeMaterial(code: string | null | undefined): MaterialClass {
  if (!code) return 'aq-matte';
  return GRADE_MATERIAL[code] ?? 'aq-matte';
}
