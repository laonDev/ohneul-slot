export type CategoryId =
  | 'all' | 'korean' | 'chinese' | 'western' | 'japanese' | 'bunsik' | 'soloeat' | 'meeting';

export interface Menu {
  id: string;
  name: string;
  emoji: string;
  category: Exclude<CategoryId, 'all'>;
}

export interface HistoryEntry {
  date: string;   // 'YYYY-MM-DD'
  menuId: string;
  category: Exclude<CategoryId, 'all'>;
}

export interface Settings {
  pushEnabled: boolean;
  pushTime: string;       // 'HH:mm'
  lastCategory: CategoryId;
  soundEnabled: boolean;
}

export type Rng = () => number; // [0,1) — 테스트에서 주입 가능
