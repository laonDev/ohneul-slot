import type { CategoryId } from '../core/types';

export interface Category { id: CategoryId; label: string; emoji: string; }

export const CATEGORIES: Category[] = [
  { id: 'all',      label: '전체',   emoji: '🎰' },
  { id: 'korean',   label: '한식',   emoji: '🍚' },
  { id: 'chinese',  label: '중식',   emoji: '🥡' },
  { id: 'western',  label: '양식',   emoji: '🍝' },
  { id: 'japanese', label: '일식',   emoji: '🍣' },
  { id: 'bunsik',   label: '분식',   emoji: '🍢' },
  { id: 'soloeat',  label: '혼밥',   emoji: '🍱' },
  { id: 'meeting',  label: '회식',   emoji: '🍻' },
];
