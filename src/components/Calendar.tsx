import { useMemo, useState } from 'react';
import { useStore } from '../store';
import type { Page } from '../types';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// A small palette of event colors, picked deterministically per page.
const EVENT_COLORS = [
  '#4a90f2', '#7b6cf0', '#e0584f', '#e8a33d',
  '#3bb273', '#d4569f', '#2bb3c0', '#f0743b',
];

function eventColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return EVENT_COLORS[h % EVENT_COLORS.length];
}

// Day key in local time, e.g. "2026-6-2"
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function sameDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b);
}

interface CalendarDay {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  events: Page[];
}

export function Calendar() {
  const { pages, visitPage, createPage } = useStore();
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  // Group pages by the day they were created.
  const pagesByDay = useMemo(() => {
    const map = new Map<string, Page[]>();
    for (const page of Object.values(pages)) {
      const key = dayKey(new Date(page.createdAt));
      const list = map.get(key);
      if (list) list.push(page);
      else map.set(key, [page]);
    }
    for (const list of map.values()) list.sort((a, b) => a.createdAt - b.createdAt);
    return map;
  }, [pages]);

  // Build a 6-week grid starting on Monday.
  const weeks = useMemo<CalendarDay[][]>(() => {
    const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    // JS: 0=Sun..6=Sat → shift so Monday is the first column.
    const offset = (firstOfMonth.getDay() + 6) % 7;
    const start = new Date(firstOfMonth);
    start.setDate(1 - offset);

    const grid: CalendarDay[][] = [];
    const d = new Date(start);
    for (let w = 0; w < 6; w++) {
      const row: CalendarDay[] = [];
      for (let i = 0; i < 7; i++) {
        row.push({
          date: new Date(d),
          inMonth: d.getMonth() === cursor.getMonth(),
          isToday: sameDay(d, today),
          events: pagesByDay.get(dayKey(d)) ?? [],
        });
        d.setDate(d.getDate() + 1);
      }
      grid.push(row);
    }
    return grid;
  }, [cursor, pagesByDay, today]);

  const goToday = () => setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
  const prevMonth = () => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  const nextMonth = () => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));

  return (
    <div className="calendar">
      <div className="cal-toolbar">
        <div className="cal-title-group">
          <h1 className="cal-title">
            {MONTHS[cursor.getMonth()]}
            <span className="cal-year"> {cursor.getFullYear()}</span>
          </h1>
        </div>
        <div className="cal-controls">
          <button className="cal-today-btn" onClick={goToday}>Today</button>
          <div className="cal-nav">
            <button className="cal-nav-btn" onClick={prevMonth} title="Previous month">‹</button>
            <button className="cal-nav-btn" onClick={nextMonth} title="Next month">›</button>
          </div>
        </div>
      </div>

      <div className="cal-grid">
        <div className="cal-weekdays">
          {WEEKDAYS.map((w) => (
            <div key={w} className="cal-weekday">{w}</div>
          ))}
        </div>

        <div className="cal-weeks">
          {weeks.map((week, wi) => (
            <div key={wi} className="cal-week">
              {week.map((day) => (
                <div
                  key={dayKey(day.date)}
                  className={`cal-day ${day.inMonth ? '' : 'cal-day--out'} ${day.isToday ? 'cal-day--today' : ''}`}
                  onDoubleClick={() => createPage()}
                >
                  <div className="cal-day-head">
                    <span className={`cal-day-num ${day.isToday ? 'cal-day-num--today' : ''}`}>
                      {day.date.getDate()}
                    </span>
                  </div>
                  <div className="cal-events">
                    {day.events.slice(0, 4).map((ev) => (
                      <button
                        key={ev.id}
                        className="cal-event"
                        style={{ '--ev': eventColor(ev.id) } as React.CSSProperties}
                        onClick={(e) => { e.stopPropagation(); visitPage(ev.id); }}
                        title={ev.title || 'Untitled'}
                      >
                        <span className="cal-event-dot" />
                        <span className="cal-event-icon">{ev.icon}</span>
                        <span className="cal-event-title">{ev.title || 'Untitled'}</span>
                      </button>
                    ))}
                    {day.events.length > 4 && (
                      <div className="cal-event-more">+{day.events.length - 4} more</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
