import { useEffect, useState, useCallback } from 'react';
import { getJSON, setJSON } from '../platform/storage';
import type { HistoryEntry, Settings } from '../core/types';

const K_HISTORY = 'ohneul:history';
const K_FAV = 'ohneul:favorites';
const K_SETTINGS = 'ohneul:settings';

const DEFAULT_SETTINGS: Settings = {
  pushEnabled: false, pushTime: '11:30', lastCategory: 'all', soundEnabled: true,
};

export function useAppState() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  // 최초 로드
  useEffect(() => {
    let active = true;
    (async () => {
      const [h, f, s] = await Promise.all([
        getJSON<HistoryEntry[]>(K_HISTORY, []),
        getJSON<string[]>(K_FAV, []),
        getJSON<Settings>(K_SETTINGS, DEFAULT_SETTINGS),
      ]);
      if (!active) return;
      setHistory(h);
      setFavorites(f);
      setSettings(s);
      setLoaded(true);
    })();
    return () => { active = false; };
  }, []);

  // 변경 시 영속화 (로드 완료 후에만 — 초기 기본값으로 덮어쓰기 방지)
  useEffect(() => { if (loaded) void setJSON(K_HISTORY, history); }, [history, loaded]);
  useEffect(() => { if (loaded) void setJSON(K_FAV, favorites); }, [favorites, loaded]);
  useEffect(() => { if (loaded) void setJSON(K_SETTINGS, settings); }, [settings, loaded]);

  const addHistory = useCallback((entry: HistoryEntry) => {
    setHistory(prev => [...prev, entry]);
  }, []);

  const toggleFavorite = useCallback((menuId: string) => {
    setFavorites(prev =>
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId],
    );
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...patch }));
  }, []);

  return { loaded, history, favorites, settings, addHistory, toggleFavorite, updateSettings };
}
