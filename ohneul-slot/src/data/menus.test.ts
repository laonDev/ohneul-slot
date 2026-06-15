import { describe, it, expect } from 'vitest';
import { MENUS } from './menus';
import { CATEGORIES } from './categories';

const validCats = new Set(CATEGORIES.map(c => c.id).filter(id => id !== 'all'));

describe('MENUS', () => {
  it('has at least 245 menus', () => {
    expect(MENUS.length).toBeGreaterThanOrEqual(245);
  });
  it('all ids are unique', () => {
    const ids = MENUS.map(m => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('every menu has a valid category, name, and emoji', () => {
    for (const m of MENUS) {
      expect(validCats.has(m.category)).toBe(true);
      expect(m.name.length).toBeGreaterThan(0);
      expect(m.emoji.length).toBeGreaterThan(0);
    }
  });
  it('every non-"all" category has at least 25 menus', () => {
    for (const cat of validCats) {
      expect(MENUS.filter(m => m.category === cat).length).toBeGreaterThanOrEqual(25);
    }
  });
});
