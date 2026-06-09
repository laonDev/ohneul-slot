import type { HistoryEntry } from '../core/types';
import { MENUS } from '../data/menus';
import { weekEntries } from '../core/history-util';

const DOW = ['월','화','수','목','금','토','일'];

function menuName(id: string) { return MENUS.find(m => m.id === id)?.name ?? '?'; }
function menuEmoji(id: string) { return MENUS.find(m => m.id === id)?.emoji ?? '🍽️'; }

export function HistoryView({ history, today, onClose }:
  { history: HistoryEntry[]; today: string; onClose: () => void }) {
  const week = weekEntries(history, today);
  const byDate = new Map(week.map(e => [e.date, e]));
  const [y, m, d] = today.split('-').map(Number);
  const base = Date.UTC(y, m - 1, d);
  const monday = base - ((new Date(base).getUTCDay() + 6) % 7) * 86400000;

  return (
    <div className="history-view">
      <header><h2>이번 주 점심</h2><button type="button" onClick={onClose}>닫기</button></header>
      <ul>
        {DOW.map((label, i) => {
          const dt = new Date(monday + i * 86400000).toISOString().slice(0, 10);
          const e = byDate.get(dt);
          return (
            <li key={dt} className={dt === today ? 'today' : ''}>
              <span className="dow">{label}</span>
              <span>{e ? `${menuEmoji(e.menuId)} ${menuName(e.menuId)}` : '—'}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
