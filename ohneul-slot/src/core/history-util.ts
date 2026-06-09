import type { HistoryEntry } from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toUTC(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function daysSince(from: string, to: string): number {
  return Math.round((toUTC(to) - toUTC(from)) / MS_PER_DAY);
}

/** 월요일 시작 주의 시작 날짜(ms) */
function mondayOf(date: string): number {
  const t = toUTC(date);
  const dow = new Date(t).getUTCDay();        // 0=Sun..6=Sat
  const offset = (dow + 6) % 7;               // Mon=0
  return t - offset * MS_PER_DAY;
}

export function weekEntries(history: HistoryEntry[], date: string): HistoryEntry[] {
  const start = mondayOf(date);
  const end = start + 7 * MS_PER_DAY;
  return history.filter(e => { const t = toUTC(e.date); return t >= start && t < end; });
}

export function alreadyEatenToday(history: HistoryEntry[], today: string): boolean {
  return history.some(e => e.date === today);
}
