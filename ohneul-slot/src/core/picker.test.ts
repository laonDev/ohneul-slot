import { describe, it, expect } from 'vitest';
import { menuWeight, weightedPick } from './picker';
import type { Menu, HistoryEntry } from './types';

const M = (id: string): Menu => ({ id, name: id, emoji: '🍚', category: 'korean' });
const candidates = [M('a'), M('b'), M('c')];

describe('menuWeight', () => {
  it('is 1 when never eaten and not favorite', () => {
    expect(menuWeight(M('a'), [], new Set(), '2026-06-09')).toBeCloseTo(1);
  });
  it('drops sharply when eaten yesterday', () => {
    const h: HistoryEntry[] = [{ date: '2026-06-08', menuId: 'a', category: 'korean' }];
    expect(menuWeight(M('a'), h, new Set(), '2026-06-09')).toBeLessThan(0.2);
  });
  it('recovers fully after 7+ days', () => {
    const h: HistoryEntry[] = [{ date: '2026-06-01', menuId: 'a', category: 'korean' }];
    expect(menuWeight(M('a'), h, new Set(), '2026-06-09')).toBeCloseTo(1);
  });
  it('boosts favorites', () => {
    const w = menuWeight(M('a'), [], new Set(['a']), '2026-06-09');
    expect(w).toBeGreaterThan(1);
  });
  it('favorite여도 오늘 먹었으면 여전히 억제된다 (recency가 우선)', () => {
    const h: HistoryEntry[] = [{ date: '2026-06-09', menuId: 'a', category: 'korean' }];
    const w = menuWeight(M('a'), h, new Set(['a']), '2026-06-09');
    expect(w).toBeLessThan(0.1); // 0.05 * 1.3 = 0.065
  });
  it('같은 메뉴 복수 기록이면 가장 최근(가장 낮은) decay를 적용한다', () => {
    const h: HistoryEntry[] = [
      { date: '2026-06-09', menuId: 'a', category: 'korean' }, // d=0
      { date: '2026-06-06', menuId: 'a', category: 'korean' }, // d=3
    ];
    const w = menuWeight(M('a'), h, new Set(), '2026-06-09');
    expect(w).toBeCloseTo(0.05, 2); // d=0이 지배
  });
});

describe('weightedPick', () => {
  it('returns null for empty candidates', () => {
    expect(weightedPick([], [], new Set(), '2026-06-09', () => 0.5)).toBeNull();
  });
  it('is deterministic for a given rng value', () => {
    // 모두 weight 1 → 누적 [1,2,3], rng=0.5 → 0.5*3=1.5 → 두 번째(b)
    const picked = weightedPick(candidates, [], new Set(), '2026-06-09', () => 0.5);
    expect(picked?.id).toBe('b');
  });
  it('never returns a zero-weight-only impossible pick', () => {
    const picked = weightedPick(candidates, [], new Set(), '2026-06-09', () => 0.999999);
    expect(picked?.id).toBe('c');
  });
});
