import { describe, it, expect } from 'vitest';
import { CATEGORIES } from './categories';

describe('CATEGORIES', () => {
  it('includes "all" first and has unique ids', () => {
    expect(CATEGORIES[0].id).toBe('all');
    const ids = CATEGORIES.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
