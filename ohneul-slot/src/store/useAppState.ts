import { useEffect, useState, useCallback } from 'react';
import { getJSON, setJSON } from '../platform/storage';
import { newId } from '../core/customSet';
import type { HistoryEntry, Settings, CustomSet, Menu } from '../core/types';

const K_HISTORY = 'ohneul:history';
const K_FAV = 'ohneul:favorites';
const K_SETTINGS = 'ohneul:settings';
const K_SETS = 'ohneul:customsets';

const DEFAULT_SETTINGS: Settings = {
  pushEnabled: false, pushTime: '11:30', lastCategory: 'all', soundEnabled: true,
};

export function useAppState() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [customSets, setCustomSets] = useState<CustomSet[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const [h, f, s, c] = await Promise.all([
        getJSON<HistoryEntry[]>(K_HISTORY, []),
        getJSON<string[]>(K_FAV, []),
        getJSON<Settings>(K_SETTINGS, DEFAULT_SETTINGS),
        getJSON<CustomSet[]>(K_SETS, []),
      ]);
      if (!active) return;
      setHistory(h); setFavorites(f); setSettings(s); setCustomSets(c);
      setLoaded(true);
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => { if (loaded) void setJSON(K_HISTORY, history); }, [history, loaded]);
  useEffect(() => { if (loaded) void setJSON(K_FAV, favorites); }, [favorites, loaded]);
  useEffect(() => { if (loaded) void setJSON(K_SETTINGS, settings); }, [settings, loaded]);
  useEffect(() => { if (loaded) void setJSON(K_SETS, customSets); }, [customSets, loaded]);

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

  const addSet = useCallback((name: string, items: Menu[]): string => {
    const id = newId('set');
    setCustomSets(prev => [...prev, { id, name, items }]);
    return id;
  }, []);

  const updateSet = useCallback((set: CustomSet) => {
    setCustomSets(prev => prev.map(s => (s.id === set.id ? set : s)));
  }, []);

  const deleteSet = useCallback((id: string) => {
    setCustomSets(prev => prev.filter(s => s.id !== id));
  }, []);

  return {
    loaded, history, favorites, settings, customSets,
    addHistory, toggleFavorite, updateSettings, addSet, updateSet, deleteSet,
  };
}
