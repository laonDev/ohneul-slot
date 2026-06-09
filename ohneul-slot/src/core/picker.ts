import type { Menu, HistoryEntry, Rng } from './types';
import { daysSince } from './history-util';

const FAVORITE_BOOST = 1.3;

/** 최근에 먹었을수록 0에 가깝게, 7일 이상이면 1.0으로 회복 */
function recencyDecay(menu: Menu, history: HistoryEntry[], today: string): number {
  let decay = 1;
  for (const e of history) {
    if (e.menuId !== menu.id) continue;
    const d = daysSince(e.date, today);
    if (d < 0 || d >= 7) continue;
    // d=0 → 0.05, d=1 → ~0.19, d=3 → ~0.46, d=6 → ~0.87
    const factor = 0.05 + (d / 7) * 0.95;
    decay = Math.min(decay, factor);
  }
  return decay;
}

export function menuWeight(
  menu: Menu, history: HistoryEntry[], favorites: Set<string>, today: string,
): number {
  const base = 1;
  const fav = favorites.has(menu.id) ? FAVORITE_BOOST : 1;
  return base * recencyDecay(menu, history, today) * fav;
}

export function weightedPick(
  candidates: Menu[], history: HistoryEntry[], favorites: Set<string>, today: string, rng: Rng,
): Menu | null {
  if (candidates.length === 0) return null;
  const weights = candidates.map(m => Math.max(menuWeight(m, history, favorites, today), 0.0001));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r < 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}
