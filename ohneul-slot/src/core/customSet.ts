import type { Menu, CustomSet } from './types';
import { findCanonicalMenu } from './menuMatch';

/** 짧은 고유 id 생성 (예: 'set:labc-x9k2') */
export function newId(prefix: string): string {
  return `${prefix}:${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** 직접 입력 메뉴명 → 합성 Menu. 이름을 표준 메뉴와 매칭해 아이콘/카테고리 추정. */
export function makeCustomMenu(name: string): Menu {
  const trimmed = name.trim();
  const canon = findCanonicalMenu(trimmed);
  return {
    id: newId('custom'),
    name: trimmed,
    emoji: canon?.emoji ?? '🍽️',
    category: canon?.category ?? 'soloeat',
  };
}

/** 스핀 가능: 항목 2개 이상 */
export function canSpinSet(set: CustomSet): boolean {
  return set.items.length >= 2;
}
