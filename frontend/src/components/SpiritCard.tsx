import type { SpiritSummary } from '../shared';
import { rarityTone } from '../lib/material';
import { GlassCard } from './GlassCard';

interface SpiritCardProps {
  spirit: SpiritSummary;
  active?: boolean;
  onClick?: () => void;
}

/**
 * 精灵卡片：统一液态玻璃材质（.aq-glass），稀有度仅以名字配色（rarityTone）
 * 区分。按压液态反馈 / 指尖光斑 / 键盘可达性统一由 GlassCard 提供。
 */
export function SpiritCard({ spirit, active, onClick }: SpiritCardProps) {
  const tone = rarityTone(spirit.rarity_code);

  return (
    <GlassCard active={active} onClick={onClick} style={{ padding: 16 }}>
      <div
        className="spirit-card__top"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}
      >
        <span
          className="spirit-card__rarity"
          style={{ fontSize: 12, color: tone, fontWeight: 700, letterSpacing: '0.02em' }}
        >
          {spirit.rarity_name ?? '未知'}
        </span>
        <span className="spirit-card__id" style={{ fontSize: 11, color: 'var(--aq-muted)' }}>
          #{spirit.race_id}
        </span>
      </div>

      <div
        className="spirit-card__name"
        style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}
      >
        {spirit.spirit_name}
      </div>

      <div className="spirit-card__tags" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {spirit.elements.map((el) => (
          <span key={el} className="tag-pill">
            {el}
          </span>
        ))}
        {spirit.jobs.slice(0, 2).map((job) => (
          <span key={job} className="tag-pill">
            {job}
          </span>
        ))}
      </div>
    </GlassCard>
  );
}
