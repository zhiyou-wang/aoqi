import { useState } from 'react';
import { fetchSpiritDetail } from '../api/client';
import { useFetch } from '../lib/useFetch';
import { GlassPanel } from '../components/GlassPanel';
import { rarityTone, gradeMaterial } from '../lib/material';

const SCORE_LABELS = ['生命', '攻击', '物防', '魔防', '速度'];
const SCORE_MAX = 10;

type Tab = 'profile' | 'skills' | 'skins';

interface Props {
  raceId: number;
  onBack: () => void;
}

/**
 * 精灵详情页：档案 / 技能 / 皮肤 三页签。
 * 稀有度用材质徽章，技能用插槽，皮肤用品级材质。
 */
export function SpiritDetailPage({ raceId, onBack }: Props) {
  const [tab, setTab] = useState<Tab>('profile');
  const { data: detail, loading, error } = useFetch(
    () => fetchSpiritDetail(raceId),
    [raceId],
  );

  if (loading) {
    return <div className="state-hint">加载中…</div>;
  }
  if (error || !detail?.data) {
    return (
      <div className="state-hint">
        未找到精灵 #{raceId}
        <br />
        <button onClick={onBack} style={{ marginTop: 16, padding: '8px 16px', borderRadius: 999 }}>
          返回列表
        </button>
      </div>
    );
  }

  const spirit = detail.data;
  const tone = rarityTone(spirit.rarity_code);

  return (
    <main>
      <GlassPanel className="dex-header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            borderRadius: 999,
            border: '1px solid oklch(0.85 0.05 225 / 0.2)',
            background: 'oklch(0.20 0.04 248 / 0.4)',
            color: 'var(--aq-ink)',
            cursor: 'pointer',
            font: 'inherit',
          }}
        >
          ← 返回
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 30 }}>{spirit.spirit_name}</h1>
          <p className="detail-meta" style={{ margin: '4px 0 0' }}>
            <span style={{ color: tone, fontWeight: 700 }}>{spirit.rarity_name ?? '未知'}</span>
            {spirit.position_name && <> · {spirit.position_name}</>}
            {spirit.jobs.length > 0 && <> · {spirit.jobs.map((j) => j.job_name).join('、')}</>}
          </p>
        </div>
      </GlassPanel>

      <div className="detail-shell">
        <aside>
          <GlassPanel className="detail-panel">
            <h2>基本档案</h2>
            <div className="detail-section" style={{ marginTop: 16 }}>
              <h3>五维评分</h3>
              {spirit.scores.map((score, i) => (
                <div
                  key={SCORE_LABELS[i]}
                  className="detail-row"
                  style={{ alignItems: 'center', gap: 10 }}
                >
                  <span style={{ width: 40 }}>{SCORE_LABELS[i]}</span>
                  <div className="aq-gauge" style={{ flex: 1 }}>
                    <i style={{ width: `${Math.min(100, (score / SCORE_MAX) * 100)}%` }} />
                  </div>
                  <span style={{ width: 24, textAlign: 'right' }}>{score}</span>
                </div>
              ))}
            </div>

            <div className="detail-section">
              <h3>元素 / 时代</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {spirit.elements.map((el) => (
                  <span key={el} className="tag-pill">{el}</span>
                ))}
                {spirit.eras.map((er) => (
                  <span key={er} className="tag-pill">{er}</span>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <h3>档案信息</h3>
              {[
                ['性别', spirit.gender_code],
                ['生日', spirit.birthday_text],
                ['身高', spirit.height_text],
                ['体重', spirit.weight_text],
                ['出生地', spirit.birthplace_text],
                ['爱好', spirit.hobby_text],
                ['性格', spirit.character_text],
              ]
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label} className="detail-row">
                    <span>{label}</span>
                    <span>{value}</span>
                  </div>
                ))}
            </div>
          </GlassPanel>
        </aside>

        <section>
          <GlassPanel className="detail-panel">
            <div className="tabs">
              <button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>
                档案
              </button>
              <button className={tab === 'skills' ? 'active' : ''} onClick={() => setTab('skills')}>
                技能 {spirit.skills.length > 0 && `(${spirit.skills.length})`}
              </button>
              <button className={tab === 'skins' ? 'active' : ''} onClick={() => setTab('skins')}>
                皮肤 {spirit.skins.length > 0 && `(${spirit.skins.length})`}
              </button>
            </div>

            {tab === 'profile' && (
              <div>
                {spirit.resume_text && (
                  <div className="detail-section">
                    <h3>定位</h3>
                    <p style={{ margin: 0, lineHeight: 1.7 }}>{spirit.resume_text}</p>
                  </div>
                )}
                {spirit.strategy_text && (
                  <div className="detail-section">
                    <h3>攻略短句</h3>
                    <p style={{ margin: 0, lineHeight: 1.7 }}>{spirit.strategy_text}</p>
                  </div>
                )}
                {spirit.introduce_text && (
                  <div className="detail-section">
                    <h3>介绍</h3>
                    <p style={{ margin: 0, lineHeight: 1.8, color: 'oklch(0.82 0.03 225)' }}>
                      {spirit.introduce_text}
                    </p>
                  </div>
                )}
                {!spirit.resume_text && !spirit.strategy_text && !spirit.introduce_text && (
                  <div className="state-hint">暂无档案资料</div>
                )}
              </div>
            )}

            {tab === 'skills' && (
              <div>
                {spirit.skills.length > 0 ? (
                  spirit.skills.map((skill, i) => (
                    <div key={`${skill.skill_id}-${i}`} className="skill-item">
                      <div className="skill-item__head">
                        <span className="skill-item__slot">{skill.slot_name ?? skill.slot_code}</span>
                        <span className="skill-item__name">{skill.skill_name ?? '未知技能'}</span>
                        {skill.skill_type && <span className="skill-item__type">{skill.skill_type}</span>}
                      </div>
                      {skill.levels.map((lv) => (
                        <p key={String(lv.skill_level ?? lv.level_skill_id ?? '')} className="skill-item__desc">
                          {lv.skill_level ? `Lv.${lv.skill_level} ` : ''}
                          {lv.skill_desc as string}
                        </p>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="state-hint">暂无技能数据</div>
                )}
              </div>
            )}

            {tab === 'skins' && (
              <div>
                {spirit.skins.length > 0 ? (
                  spirit.skins.map((skin) => (
                    <div key={skin.form_skin_id} className="skin-item">
                      <span className="skin-item__name">{skin.skin_name ?? '皮肤'}</span>
                      {skin.is_base === 'Y' && (
                        <span style={{ fontSize: 11, color: 'var(--aq-muted)' }}>本体</span>
                      )}
                      <span
                        className={`skin-item__grade ${gradeMaterial(skin.grade_code)}`}
                        style={{ padding: '3px 10px', borderRadius: 999 }}
                      >
                        {skin.grade_name ?? '普通'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="state-hint">暂无皮肤数据</div>
                )}
              </div>
            )}
          </GlassPanel>
        </section>
      </div>
    </main>
  );
}
