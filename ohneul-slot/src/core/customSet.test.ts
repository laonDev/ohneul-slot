import { describe, it, expect } from 'vitest';
import { makeCustomMenu, canSpinSet, newId } from './customSet';
import type { CustomSet } from './types';

describe('newId', () => {
  it('prefixes and is non-empty', () => {
    expect(newId('set').startsWith('set:')).toBe(true);
  });
});

describe('makeCustomMenu', () => {
  it('matches a known name to its category/emoji', () => {
    const m = makeCustomMenu('얼큰김치찌개'); // → 김치찌개(korean)
    expect(m.name).toBe('얼큰김치찌개');
    expect(m.id.startsWith('custom:')).toBe(true);
    expect(m.category).toBe('korean');
    expect(m.emoji.length).toBeGreaterThan(0);
  });
  it('falls back for unknown names', () => {
    const m = makeCustomMenu('존재안함xyz123');
    expect(m.emoji).toBe('🍽️');
    expect(m.category).toBe('soloeat');
  });
  it('trims whitespace', () => {
    expect(makeCustomMenu('  국밥  ').name).toBe('국밥');
  });
});

describe('canSpinSet', () => {
  const item = (id: string) => ({ id, name: id, emoji: '🍚', category: 'korean' as const });
  const set = (items: ReturnType<typeof item>[]): CustomSet => ({ id: 's', name: 'x', items });
  it('needs at least 2 items', () => {
    expect(canSpinSet(set([]))).toBe(false);
    expect(canSpinSet(set([item('a')]))).toBe(false);
    expect(canSpinSet(set([item('a'), item('b')]))).toBe(true);
  });
});
