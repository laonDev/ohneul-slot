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

  useEffect(() => {
    (async () => {
      setHistory(await getJSON<HistoryEntry[]>(K_HISTORY, []));
      setFavorites(await getJSON<string[]>(K_FAV, []));
      setSettings(await getJSON<Settings>(K_SETTINGS, DEFAULT_SETTINGS));
      setLoaded(true);
    })();
  }, []);

  const addHistory = useCallback((entry: HistoryEntry) => {
    setHistory(prev => { const next = [...prev, entry]; setJSON(K_HISTORY, next); return next; });
  }, []);

  const toggleFavorite = useCallback((menuId: string) => {
    setFavorites(prev => {
      const next = prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId];
      setJSON(K_FAV, next); return next;
    });
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings(prev => { const next = { ...prev, ...patch }; setJSON(K_SETTINGS, next); return next; });
  }, []);

  return { loaded, history, favorites, settings, addHistory, toggleFavorite, updateSettings };
}
