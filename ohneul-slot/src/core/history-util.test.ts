import { describe, it, expect } from 'vitest';
import { daysSince, weekEntries, alreadyEatenToday } from './history-util';
import type { HistoryEntry } from './types';

const H: HistoryEntry[] = [
  { date: '2026-06-08', menuId: 'k04', category: 'korean' },
  { date: '2026-06-09', menuId: 'c01', category: 'chinese' },
];

describe('daysSince', () => {
  it('returns whole-day difference', () => {
    expect(daysSince('2026-06-08', '2026-06-09')).toBe(1);
    expect(daysSince('2026-06-09', '2026-06-09')).toBe(0);
  });
  it('handles month boundaries and negative differences', () => {
    expect(daysSince('2026-05-31', '2026-06-01')).toBe(1);
    expect(daysSince('2026-06-09', '2026-06-08')).toBe(-1);
  });
});

describe('weekEntries', () => {
  it('returns entries in the same ISO week (Mon start) as the given date', () => {
    // 2026-06-08 is Monday; 2026-06-09 Tuesday → same week
    expect(weekEntries(H, '2026-06-09').length).toBe(2);
    expect(weekEntries(H, '2026-06-15').length).toBe(0); // next week
  });
});

describe('alreadyEatenToday', () => {
  it('detects an entry already logged for the date', () => {
    expect(alreadyEatenToday(H, '2026-06-09')).toBe(true);
    expect(alreadyEatenToday(H, '2026-06-10')).toBe(false);
  });
});
