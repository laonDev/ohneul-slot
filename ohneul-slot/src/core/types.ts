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
  name?: string;  // 표시용 스냅샷(커스텀/구버전 대응)
  emoji?: string;
}

export interface Settings {
  pushEnabled: boolean;
  pushTime: string;       // 'HH:mm'
  lastCategory: CategoryId;
  soundEnabled: boolean;
}

export type Rng = () => number; // [0,1) — 테스트에서 주입 가능

export interface CustomSet {
  id: string;      // 'set:<uid>'
  name: string;
  items: Menu[];   // Menu 스냅샷 (내장=복사, 직접입력=합성)
}
