import type { HistoryEntry } from '../core/types';
import { MENUS } from '../data/menus';
import { weekEntries } from '../core/history-util';
import { MenuIcon } from './MenuIcon';

const DOW = ['월','화','수','목','금','토','일'];

function findMenu(id: string) { return MENUS.find(m => m.id === id); }

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
          const menu = e ? findMenu(e.menuId) : undefined;
          return (
            <li key={dt} className={dt === today ? 'today' : ''}>
              <span className="dow">{label}</span>
              <span>{menu ? <><MenuIcon menu={menu} size={22} /> {menu.name}</> : '—'}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
