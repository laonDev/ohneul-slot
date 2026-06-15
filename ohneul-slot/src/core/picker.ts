import type { Menu, HistoryEntry, Rng } from './types';
import { daysSince } from './history-util';

const FAVORITE_BOOST = 1.3;
const BASE_WEIGHT = 1; // 기본 가중치 (향후 카테고리/시간대별 조정 여지)

/** 최근에 먹었을수록 0에 가깝게, 7일 이상이면 1.0으로 회복 */
function recencyDecay(menu: Menu, history: HistoryEntry[], today: string): number {
  let decay = 1;
  for (const e of history) {
    if (e.menuId !== menu.id) continue;
    const d = daysSince(e.date, today);
    // 미래 기록(d<0)·7일 이상 지난 기록은 무시 → 7일이면 완전 회복
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
  const fav = favorites.has(menu.id) ? FAVORITE_BOOST : 1;
  return BASE_WEIGHT * recencyDecay(menu, history, today) * fav;
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

export interface ThreePick {
  reels: Menu[];      // 릴에 표시될 메뉴들(당첨 1 + 미끼들), 위치 섞임
  winnerIndex: number; // reels 중 실제 당첨(셀렉터가 안착할 위치)
}

/**
 * 3릴 후보: 가중 추첨으로 '당첨' 1개를 뽑고, 같은 후보 풀에서 서로 다른 미끼 2개를 균등 추첨해
 * 섞은 뒤(위치 랜덤) winnerIndex와 함께 반환한다. 후보가 3개 미만이면 가능한 만큼만 채운다.
 */
export function pickThree(
  candidates: Menu[], history: HistoryEntry[], favorites: Set<string>, today: string, rng: Rng,
): ThreePick | null {
  const winner = weightedPick(candidates, history, favorites, today, rng);
  if (!winner) return null;

  const available = candidates.filter(m => m.id !== winner.id);
  const decoys: Menu[] = [];
  while (decoys.length < 2 && available.length > 0) {
    const idx = Math.floor(rng() * available.length);
    decoys.push(available.splice(idx, 1)[0]);
  }

  const reels = [winner, ...decoys];
  // Fisher-Yates 셔플 (위치 랜덤화)
  for (let i = reels.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = reels[i]; reels[i] = reels[j]; reels[j] = tmp;
  }
  return { reels, winnerIndex: reels.findIndex(m => m.id === winner.id) };
}
