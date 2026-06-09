import type { Menu, CategoryId } from './types';
import { MENUS } from '../data/menus';

export function getCandidates(category: CategoryId): Menu[] {
  if (category === 'all') return MENUS;
  return MENUS.filter(m => m.category === category);
}
