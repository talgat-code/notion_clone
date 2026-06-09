import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import stage0 from '../assets/tree/stage-0.png';
import stage1 from '../assets/tree/stage-1.png';
import stage2 from '../assets/tree/stage-2.png';
import stage3 from '../assets/tree/stage-3.png';
import stage4 from '../assets/tree/stage-4.png';
import stage5 from '../assets/tree/stage-5.png';

// Six growth stages, from a fresh sprout (start of a focus session) to a
// fruit-bearing tree (session finished). The tree grows with elapsed time.
const STAGES: Array<{ img: string; label: string }> = [
  { img: stage0, label: 'Sprout' },
  { img: stage1, label: 'Seedling' },
  { img: stage2, label: 'Young tree' },
  { img: stage3, label: 'Growing' },
  { img: stage4, label: 'Mature' },
  { img: stage5, label: 'Flourishing' },
];

const FOCUS_SECONDS = 25 * 60; // Pomodoro focus block
const BREAK_SECONDS = 5 * 60;  // short break

type Mode = 'focus' | 'break';

function fmt(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Map elapsed-time ratio → stage index. Start on the sprout, reach the
// fruiting tree only when the focus block is fully done.
function stageIndex(ratio: number): number {
  if (ratio <= 0) return 0;
  if (ratio >= 1) return 5;
  return Math.min(4, 1 + Math.floor(ratio * 4));
}

export function ProgressTree() {
  const { pomodoroCount, completePomodoro } = useStore();

  const [mode, setMode] = useState<Mode>('focus');
  const [left, setLeft] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);
  const zeroHandled = useRef(false);

  // Tick once per second while running.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Handle a finished block: count the focus session, then flip mode.
  useEffect(() => {
    if (left > 0) {
      zeroHandled.current = false;
      return;
    }
    if (zeroHandled.current) return;
    zeroHandled.current = true;

    if (mode === 'focus') {
      completePomodoro();
      setMode('break');
      setLeft(BREAK_SECONDS);
      setRunning(true); // roll straight into the break
    } else {
      setMode('focus');
      setLeft(FOCUS_SECONDS);
      setRunning(false);
    }
  }, [left, mode, completePomodoro]);

  const total = mode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS;
  const elapsed = total - left;
  const sessionRatio = elapsed / total;
  // The tree only grows during focus; during the break it stays fully grown.
  const treeRatio = mode === 'focus' ? elapsed / FOCUS_SECONDS : 1;
  const stage = STAGES[stageIndex(treeRatio)];

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setRunning(false);
    zeroHandled.current = false;
    setMode(next);
    setLeft(next === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS);
  };

  const reset = () => {
    setRunning(false);
    zeroHandled.current = false;
    setLeft(mode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS);
  };

  return (
    <div className="ptree">
      <h1 className="ptree-title">Focus Tree</h1>
      <div className="ptree-quote">Stay focused for 25 minutes and watch your tree grow 🌱</div>

      <div className="ptree-layout">
        {/* ─── The growing tree ─── */}
        <section className="ptree-stage-card">
          <div className="ptree-img-wrap">
            <img
              key={stage.img}
              className="ptree-img"
              src={stage.img}
              alt={`Focus tree — ${stage.label}`}
            />
          </div>

          <div className="ptree-stage-info">
            <div>
              <div className="ptree-stage-label">{stage.label}</div>
              <div className="ptree-stage-count">
                {mode === 'focus' ? `${Math.round(treeRatio * 100)}% grown` : 'Resting — well grown!'}
              </div>
            </div>
          </div>
          <div className="ptree-bar">
            <div
              className={`ptree-bar-fill ${mode === 'break' ? 'ptree-bar-fill--break' : ''}`}
              style={{ width: `${Math.round(sessionRatio * 100)}%` }}
            />
          </div>
        </section>

        {/* ─── Pomodoro timer ─── */}
        <aside className="ptree-timer-card">
          <div className="ptree-mode-tabs">
            <button
              className={`ptree-mode-tab ${mode === 'focus' ? 'active' : ''}`}
              onClick={() => switchMode('focus')}
            >
              📚 Focus
            </button>
            <button
              className={`ptree-mode-tab ${mode === 'break' ? 'active' : ''}`}
              onClick={() => switchMode('break')}
            >
              ☕ Break
            </button>
          </div>

          <div className={`ptree-time ${mode === 'break' ? 'ptree-time--break' : ''}`}>
            {fmt(left)}
          </div>
          <div className="ptree-time-sub">
            {mode === 'focus' ? '25 min study session' : '5 min rest'}
          </div>

          <div className="ptree-controls">
            <button className="ptree-btn ptree-btn--primary" onClick={() => setRunning((r) => !r)}>
              {running ? 'Pause' : 'Start'}
            </button>
            <button className="ptree-btn" onClick={reset}>Reset</button>
          </div>

          <div className="ptree-tomatoes">
            🍅 {pomodoroCount} session{pomodoroCount === 1 ? '' : 's'} completed
          </div>
        </aside>
      </div>
    </div>
  );
}
