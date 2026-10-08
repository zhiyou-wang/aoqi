import type { SpiritSummary } from '../shared';
import { rarityMaterial, rarityTone } from '../lib/material';

interface SpiritCardProps {
  spirit: SpiritSummary;
  active?: boolean;
  onClick?: () => void;
}

/**
 * 精灵卡片：用材质阶梯表达稀有度。
 * 初代→哑光、幻兽→玻璃、超能→长虹、传说→液态金属边、未探明→磨砂。
 */
export function SpiritCard({ spirit, active, onClick }: SpiritCardProps) {
  const material = rarityMaterial(spirit.rarity_code);
  const tone = rarityTone(spirit.rarity_code);

  return (
    <article
      className={`spirit-card ${material} ${active ? 'active' : ''}`.trim()}
      onClick={onClick}
      style={{ cursor: 'pointer', borderRadius: 24, padding: 16 }}
    >
      <div className="spirit-card__top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span
          className="spirit-card__rarity"
          style={{
            fontSize: 12,
            color: tone,
            fontWeight: 700,
            letterSpacing: '0.02em',
          }}
        >
          {spirit.rarity_name ?? '未知'}
        </span>
        <span className="spirit-card__id" style={{ fontSize: 11, color: 'var(--aq-muted)' }}>
          #{spirit.race_id}
        </span>
      </div>

      <div className="spirit-card__name" style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>
        {spirit.spirit_name}
      </div>

      <div className="spirit-card__tags" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {spirit.elements.map((el) => (
          <span
            key={el}
            style={{
              fontSize: 11,
              padding: '3px 8px',
              borderRadius: 999,
              color: 'var(--aq-ink)',
              background: 'oklch(0.70 0.10 210 / 0.14)',
            }}
          >
            {el}
          </span>
        ))}
        {spirit.jobs.slice(0, 2).map((job) => (
          <span
            key={job}
            style={{
              fontSize: 11,
              padding: '3px 8px',
              borderRadius: 999,
              color: 'var(--aq-muted)',
              background: 'oklch(0.22 0.04 248 / 0.5)',
            }}
          >
            {job}
          </span>
        ))}
      </div>
    </article>
  );
}
