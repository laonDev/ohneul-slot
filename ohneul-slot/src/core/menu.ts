import type { Menu, CategoryId } from './types';
import { MENUS } from '../data/menus';

export function getCandidates(category: CategoryId): Menu[] {
  if (category === 'all') return MENUS;
  return MENUS.filter(m => m.category === category);
}

/** 이름 부분일치 검색(상위 limit개). 빈 쿼리는 빈 배열. */
export function searchMenus(query: string, limit = 20): Menu[] {
  const q = query.trim();
  if (!q) return [];
  return MENUS.filter(m => m.name.includes(q)).slice(0, limit);
}
