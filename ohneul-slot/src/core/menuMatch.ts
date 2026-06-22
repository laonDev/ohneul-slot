import type { Menu } from './types';
import { MENUS } from '../data/menus';

// 식당/사용자 메뉴명에 흔히 붙는 수식어·사이즈 표기 (핵심 메뉴 추출용)
const QUALIFIERS = [
  '얼큰', '매콤한', '매콤', '매운맛', '매운', '순한', '진한', '옛날', '왕', '특대', '특',
  '순', '원조', '정통', '시골', '엄마손', '우리', '즉석', '프리미엄', '수제', '콤보',
];
const SUFFIXES = ['정식', '세트', '한상', '1인분', '2인분', '곱빼기', '곱배기'];

/** 메뉴명을 표준형으로 정규화: 괄호·공백 제거, 앞 수식어/뒤 사이즈 표기 제거 */
export function normalizeMenuName(name: string): string {
  let s = name.replace(/\([^)]*\)/g, '').replace(/\s+/g, '');
  for (const q of QUALIFIERS) { if (s.startsWith(q) && s.length > q.length + 1) { s = s.slice(q.length); break; } }
  for (const suf of SUFFIXES) { if (s.endsWith(suf) && s.length > suf.length + 1) { s = s.slice(0, -suf.length); break; } }
  return s;
}

const CANON = MENUS.map(m => ({ menu: m, norm: normalizeMenuName(m.name) }));

/**
 * 임의의 메뉴명을 우리 표준 메뉴로 매핑한다.
 * 1) 정규화 후 정확 일치 → 2) 부분 포함(가장 긴 표준명 우선). 못 찾으면 null.
 */
export function findCanonicalMenu(name: string): Menu | null {
  const n = normalizeMenuName(name);
  if (!n) return null;
  const exact = CANON.find(c => c.norm === n);
  if (exact) return exact.menu;
  let best: { menu: Menu; len: number } | null = null;
  for (const c of CANON) {
    if (c.norm.length < 2) continue;
    if (n.includes(c.norm) || c.norm.includes(n)) {
      if (!best || c.norm.length > best.len) best = { menu: c.menu, len: c.norm.length };
    }
  }
  return best ? best.menu : null;
}
