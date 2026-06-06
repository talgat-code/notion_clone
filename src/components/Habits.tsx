import { useMemo, useState } from 'react';
import { useStore } from '../store';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Day key in local time, e.g. "2026-5-31"
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function sameDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b);
}

// Sunday-anchored start of the week containing `d`.
function startOfWeek(d: Date): Date {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  s.setDate(s.getDate() - s.getDay());
  return s;
}

const PROGRESS_SEGMENTS = 10;

export function Habits() {
  const {
    habits, habitLog, habitNotes,
    toggleHabit, setHabitNote, addHabit, removeHabit,
  } = useStore();

  const today = useMemo(() => new Date(), []);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));

  const [adding, setAdding] = useState(false);
  const [draftEmoji, setDraftEmoji] = useState('✅');
  const [draftName, setDraftName] = useState('');

  // The 7 days of the visible week.
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const isDone = (d: Date, habitId: string) => !!habitLog[`${dayKey(d)}__${habitId}`];

  const dayProgress = (d: Date) => {
    if (habits.length === 0) return 0;
    const done = habits.reduce((n, h) => n + (isDone(d, h.id) ? 1 : 0), 0);
    return done / habits.length;
  };

  // Per-habit completions across the visible week (the AVERAGE row).
  const habitWeekCount = (habitId: string) =>
    days.reduce((n, d) => n + (isDone(d, habitId) ? 1 : 0), 0);

  const weekLabel = () => {
    const end = days[6];
    if (weekStart.getMonth() === end.getMonth()) {
      return `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
    }
    return `${MONTHS[weekStart.getMonth()].slice(0, 3)} ${weekStart.getDate()} – ${MONTHS[end.getMonth()].slice(0, 3)} ${end.getDate()}, ${end.getFullYear()}`;
  };

  const goThisWeek = () => setWeekStart(startOfWeek(today));
  const prevWeek = () => setWeekStart((w) => { const n = new Date(w); n.setDate(n.getDate() - 7); return n; });
  const nextWeek = () => setWeekStart((w) => { const n = new Date(w); n.setDate(n.getDate() + 7); return n; });

  const submitHabit = () => {
    if (!draftName.trim()) return;
    addHabit(draftName, draftEmoji);
    setDraftName('');
    setDraftEmoji('✅');
    setAdding(false);
  };

  return (
    <div className="habits">
      <h1 className="habits-title">Habit tracker</h1>
      <div className="habits-quote">Progress not Perfection</div>

      <div className="habits-layout">
        {/* ─── Habit List ─── */}
        <aside className="habit-list-card">
          <div className="habit-list-head">
            <span className="habit-list-icon">☰</span>
            <h2>Habit List</h2>
          </div>
          <ul className="habit-list">
            {habits.map((h) => (
              <li key={h.id} className="habit-list-item">
                <span className="habit-bullet">•</span>
                <span className="habit-name">{h.name}</span>
                <span className="habit-emoji">{h.emoji}</span>
                <button
                  className="habit-remove"
                  title="Remove habit"
                  onClick={() => removeHabit(h.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          {adding ? (
            <div className="habit-add-form">
              <input
                className="habit-add-emoji"
                value={draftEmoji}
                onChange={(e) => setDraftEmoji(e.target.value)}
                maxLength={2}
                aria-label="Emoji"
              />
              <input
                className="habit-add-name"
                placeholder="New habit…"
                value={draftName}
                autoFocus
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitHabit();
                  else if (e.key === 'Escape') { setAdding(false); setDraftName(''); }
                }}
              />
              <button className="habit-add-confirm" onClick={submitHabit}>Add</button>
            </div>
          ) : (
            <button className="habit-add-btn" onClick={() => setAdding(true)}>
              + Add habit
            </button>
          )}
        </aside>

        {/* ─── This Week table ─── */}
        <section className="habit-week-card">
          <div className="habit-week-head">
            <h2><span className="habit-week-icon">📅</span> This Week</h2>
            <div className="habit-week-controls">
              <span className="habit-week-range">{weekLabel()}</span>
              <button className="habit-today-btn" onClick={goThisWeek}>Today</button>
              <div className="habit-nav">
                <button onClick={prevWeek} title="Previous week">‹</button>
                <button onClick={nextWeek} title="Next week">›</button>
              </div>
            </div>
          </div>

          <div className="habit-table-scroll">
            <table className="habit-table">
              <thead>
                <tr>
                  <th className="ht-date">📅 Date</th>
                  <th className="ht-progress">◌ Progress Bar</th>
                  {habits.map((h) => (
                    <th key={h.id} className="ht-habit" title={h.name}>{h.emoji}</th>
                  ))}
                  <th className="ht-notes">✏️ Notes</th>
                </tr>
              </thead>
              <tbody>
                {days.map((d) => {
                  const frac = dayProgress(d);
                  const filled = Math.round(frac * PROGRESS_SEGMENTS);
                  const pct = Math.round(frac * 100);
                  return (
                    <tr key={dayKey(d)} className={sameDay(d, today) ? 'ht-row--today' : ''}>
                      <td className="ht-date">
                        {MONTHS[d.getMonth()]} {d.getDate()}, {d.getFullYear()}
                      </td>
                      <td className="ht-progress">
                        <div className="ht-bar">
                          {Array.from({ length: PROGRESS_SEGMENTS }, (_, i) => (
                            <span key={i} className={`ht-seg ${i < filled ? 'ht-seg--on' : ''}`} />
                          ))}
                        </div>
                        <span className="ht-pct">{pct}%</span>
                      </td>
                      {habits.map((h) => (
                        <td key={h.id} className="ht-habit">
                          <button
                            className={`ht-check ${isDone(d, h.id) ? 'ht-check--on' : ''}`}
                            onClick={() => toggleHabit(dayKey(d), h.id)}
                            title={`${h.name} — ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`}
                          >
                            {isDone(d, h.id) ? '✓' : ''}
                          </button>
                        </td>
                      ))}
                      <td className="ht-notes">
                        <input
                          className="ht-note-input"
                          placeholder="…"
                          value={habitNotes[dayKey(d)] ?? ''}
                          onChange={(e) => setHabitNote(dayKey(d), e.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="ht-date ht-average-label">AVERAGE</td>
                  <td className="ht-progress" />
                  {habits.map((h) => (
                    <td key={h.id} className="ht-habit ht-average-val">{habitWeekCount(h.id)}</td>
                  ))}
                  <td className="ht-notes" />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
