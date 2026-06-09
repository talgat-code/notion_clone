import { useMemo, useState } from 'react';
import { useStore } from '../store';

// Growth stages keyed by completion ratio (low bound, inclusive).
const STAGES: Array<{ at: number; emoji: string; label: string }> = [
  { at: 0,    emoji: '🌱', label: 'Seed' },
  { at: 0.2,  emoji: '🌿', label: 'Sprout' },
  { at: 0.45, emoji: '🪴', label: 'Sapling' },
  { at: 0.7,  emoji: '🌳', label: 'Growing' },
  { at: 1,    emoji: '🌲', label: 'Flourishing' },
];

const GOLDEN_ANGLE = 2.39996; // radians — phyllotaxis spread for natural canopy

// Deterministic leaf position inside the canopy for leaf `i` of `total`,
// using a sunflower (phyllotaxis) layout so leaves never overlap awkwardly.
function leafPos(i: number, total: number) {
  const cx = 200;
  const cy = 150;
  const maxR = 116;
  // +0.5 keeps the very first leaf off the exact center.
  const r = maxR * Math.sqrt((i + 0.5) / Math.max(total, 1));
  const a = i * GOLDEN_ANGLE;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) * 0.82 };
}

export function ProgressTree() {
  const { treeGoals, addTreeGoal, toggleTreeGoal, removeTreeGoal } = useStore();
  const [draft, setDraft] = useState('');

  const done = treeGoals.filter((g) => g.done).length;
  const total = treeGoals.length;
  const ratio = total ? done / total : 0;
  const pct = Math.round(ratio * 100);

  const stage = useMemo(() => {
    let s = STAGES[0];
    for (const candidate of STAGES) if (ratio >= candidate.at) s = candidate;
    return s;
  }, [ratio]);

  // Trunk + canopy grow from 0.62 → 1.0 as goals get completed.
  const growth = 0.62 + 0.38 * ratio;

  const submit = () => {
    if (!draft.trim()) return;
    addTreeGoal(draft);
    setDraft('');
  };

  return (
    <div className="ptree">
      <h1 className="ptree-title">Progress Tree</h1>
      <div className="ptree-quote">Every goal you finish grows a new leaf 🌱</div>

      <div className="ptree-layout">
        {/* ─── The living tree ─── */}
        <section className="ptree-stage-card">
          <svg className="ptree-svg" viewBox="0 0 400 420" role="img"
               aria-label={`Progress tree, ${pct}% complete`}>
            <defs>
              <radialGradient id="ptree-leaf" cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor="#7ed957" />
                <stop offset="100%" stopColor="#2f9e44" />
              </radialGradient>
              <linearGradient id="ptree-trunk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a86b3c" />
                <stop offset="100%" stopColor="#6b4423" />
              </linearGradient>
            </defs>

            {/* ground */}
            <ellipse cx="200" cy="392" rx="120" ry="16" className="ptree-ground" />

            <g style={{ transform: `translateY(${(1 - growth) * 70}px) scale(${growth})`,
                        transformOrigin: '200px 392px' }}>
              {/* trunk */}
              <path
                d="M192 392 Q188 300 196 232 L204 232 Q212 300 208 392 Z"
                fill="url(#ptree-trunk)"
              />
              {/* a few branches reaching into the canopy */}
              <g stroke="url(#ptree-trunk)" strokeLinecap="round" fill="none">
                <path d="M199 250 Q150 215 132 170" strokeWidth="7" />
                <path d="M201 240 Q252 210 272 165" strokeWidth="7" />
                <path d="M200 225 Q200 185 200 150" strokeWidth="7" />
              </g>

              {/* leaves — one per goal */}
              {treeGoals.map((g, i) => {
                const { x, y } = leafPos(i, total);
                return (
                  <circle
                    key={g.id}
                    cx={x}
                    cy={y}
                    r={g.done ? 17 : 9}
                    className={`ptree-leaf ${g.done ? 'ptree-leaf--on' : ''}`}
                    fill={g.done ? 'url(#ptree-leaf)' : undefined}
                  >
                    <title>{g.text}</title>
                  </circle>
                );
              })}
            </g>
          </svg>

          <div className="ptree-stage-info">
            <span className="ptree-stage-emoji">{stage.emoji}</span>
            <div>
              <div className="ptree-stage-label">{stage.label}</div>
              <div className="ptree-stage-count">{done} / {total} goals · {pct}%</div>
            </div>
          </div>
          <div className="ptree-bar">
            <div className="ptree-bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </section>

        {/* ─── Goal list ─── */}
        <aside className="ptree-goals-card">
          <div className="ptree-goals-head">
            <span className="ptree-goals-icon">🎯</span>
            <h2>Goals</h2>
          </div>

          <ul className="ptree-goals">
            {treeGoals.map((g) => (
              <li key={g.id} className={`ptree-goal ${g.done ? 'ptree-goal--done' : ''}`}>
                <button
                  className={`ptree-check ${g.done ? 'ptree-check--on' : ''}`}
                  onClick={() => toggleTreeGoal(g.id)}
                  title={g.done ? 'Mark as not done' : 'Mark as done'}
                >
                  {g.done ? '✓' : ''}
                </button>
                <span className="ptree-goal-text">{g.text}</span>
                <button
                  className="ptree-goal-remove"
                  title="Remove goal"
                  onClick={() => removeTreeGoal(g.id)}
                >
                  ✕
                </button>
              </li>
            ))}
            {total === 0 && (
              <li className="ptree-goals-empty">No goals yet — plant your first one below.</li>
            )}
          </ul>

          <div className="ptree-add">
            <input
              className="ptree-add-input"
              placeholder="Add a goal…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
                else if (e.key === 'Escape') setDraft('');
              }}
            />
            <button className="ptree-add-btn" onClick={submit}>+ Add</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
