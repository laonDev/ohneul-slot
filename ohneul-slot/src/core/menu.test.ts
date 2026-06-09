import { describe, it, expect } from 'vitest';
import { getCandidates } from './menu';
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
