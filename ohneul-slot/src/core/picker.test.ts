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
