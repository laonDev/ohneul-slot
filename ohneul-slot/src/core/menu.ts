import type { Menu, CategoryId } from './types';
import { MENUS } from '../data/menus';
import { normalizeMenuName } from './menuMatch';

export function getCandidates(category: CategoryId): Menu[] {
  if (category === 'all') return MENUS;
  return MENUS.filter(m => m.category === category);
}

/**
 * 이름 부분일치 검색(상위 limit개). 빈 쿼리는 빈 배열.
 * 쿼리를 정규화해 수식어(얼큰/특/왕 등)를 떼고 매칭 → "얼큰김치찌개"로도 김치찌개를 찾는다.
 */
export function searchMenus(query: string, limit = 20): Menu[] {
  const q = normalizeMenuName(query);
  if (!q) return [];
  return MENUS.filter(m => m.name.includes(q) || normalizeMenuName(m.name).includes(q)).slice(0, limit);
}
