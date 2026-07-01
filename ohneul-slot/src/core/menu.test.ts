import { describe, it, expect } from 'vitest';
import { getCandidates, searchMenus } from './menu';
import { MENUS } from '../data/menus';

describe('getCandidates', () => {
  it('returns all menus for "all"', () => {
    expect(getCandidates('all').length).toBe(MENUS.length);
  });
  it('returns only matching category', () => {
    const korean = getCandidates('korean');
    expect(korean.length).toBeGreaterThan(0);
    expect(korean.every(m => m.category === 'korean')).toBe(true);
  });
});

describe('searchMenus', () => {
  it('returns menus whose name contains the query', () => {
    const r = searchMenus('국밥');
    expect(r.length).toBeGreaterThan(0);
    expect(r.every(m => m.name.includes('국밥'))).toBe(true);
  });
  it('returns empty for a blank query', () => {
    expect(searchMenus('   ')).toEqual([]);
  });
  it('caps results at the limit', () => {
    expect(searchMenus('밥', 3).length).toBeLessThanOrEqual(3);
  });
});
