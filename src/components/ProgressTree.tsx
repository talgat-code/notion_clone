import { useState } from 'react';
import { useStore } from '../store';
import stage0 from '../assets/tree/stage-0.png';
import stage1 from '../assets/tree/stage-1.png';
import stage2 from '../assets/tree/stage-2.png';
import stage3 from '../assets/tree/stage-3.png';
import stage4 from '../assets/tree/stage-4.png';
import stage5 from '../assets/tree/stage-5.png';

// Six growth stages, from a fresh sprout (nothing done) to a fruit-bearing
// tree (everything done). The middle four fill in as goals get completed.
const STAGES: Array<{ img: string; label: string }> = [
  { img: stage0, label: 'Sprout' },
  { img: stage1, label: 'Seedling' },
  { img: stage2, label: 'Young tree' },
  { img: stage3, label: 'Growing' },
  { img: stage4, label: 'Mature' },
  { img: stage5, label: 'Flourishing' },
];

// Map completion ratio → stage index. 0% stays on the sprout and a perfect
// 100% reaches the fruiting tree; everything in between spans stages 1–4.
function stageIndex(ratio: number): number {
  if (ratio <= 0) return 0;
  if (ratio >= 1) return 5;
  return Math.min(4, 1 + Math.floor(ratio * 4));
}

export function ProgressTree() {
  const { treeGoals, addTreeGoal, toggleTreeGoal, removeTreeGoal } = useStore();
  const [draft, setDraft] = useState('');

  const done = treeGoals.filter((g) => g.done).length;
  const total = treeGoals.length;
  const ratio = total ? done / total : 0;
  const pct = Math.round(ratio * 100);
  const stage = STAGES[stageIndex(ratio)];

  const submit = () => {
    if (!draft.trim()) return;
    addTreeGoal(draft);
    setDraft('');
  };

  return (
    <div className="ptree">
      <h1 className="ptree-title">Progress Tree</h1>
      <div className="ptree-quote">Every goal you finish grows your tree 🌱</div>

      <div className="ptree-layout">
        {/* ─── The living tree ─── */}
        <section className="ptree-stage-card">
          <div className="ptree-img-wrap">
            <img
              key={stage.img}
              className="ptree-img"
              src={stage.img}
              alt={`Progress tree — ${stage.label}, ${pct}% complete`}
            />
          </div>

          <div className="ptree-stage-info">
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
