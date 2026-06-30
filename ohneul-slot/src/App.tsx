import { useEffect, useMemo, useState } from 'react';
import { useAppState } from './store/useAppState';
import { getCandidates } from './core/menu';
import { pickThree } from './core/picker';
import { alreadyEatenToday } from './core/history-util';
import { canSpinSet } from './core/customSet';
import { CategoryPicker } from './components/CategoryPicker';
import { SetChips } from './components/SetChips';
import { SetEditor } from './components/SetEditor';
import { SlotMachine } from './components/SlotMachine';
import { ResultCard } from './components/ResultCard';
import { ShareButton } from './components/ShareButton';
import { HistoryView } from './components/HistoryView';
import type { CategoryId, CustomSet, Menu } from './core/types';

function todayStr(): string { return new Date().toISOString().slice(0, 10); } // UTC YYYY-MM-DD

export default function App() {
  const {
    loaded, history, favorites, settings, customSets,
    addHistory, toggleFavorite, updateSettings, addSet, updateSet, deleteSet,
  } = useAppState();
  const [category, setCategory] = useState<CategoryId>('all');
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Menu | null>(null);
  const [reels, setReels] = useState<Menu[]>([]);
  const [winnerIndex, setWinnerIndex] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [editing, setEditing] = useState<{ open: boolean; set: CustomSet | null }>({ open: false, set: null });
  const today = todayStr();
  const favSet = useMemo(() => new Set(favorites), [favorites]);

  useEffect(() => {
    if (loaded) setCategory(settings.lastCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  const activeSet = selectedSetId ? customSets.find(s => s.id === selectedSetId) ?? null : null;
  const candidates = activeSet ? activeSet.items : getCandidates(category);
  const canSpin = activeSet ? canSpinSet(activeSet) : candidates.length > 0;

  function spin() {
    const picked = pickThree(candidates, history, favSet, today, Math.random);
    if (!picked) return;
    setReels(picked.reels);
    setWinnerIndex(picked.winnerIndex);
    setResult(picked.reels[picked.winnerIndex]);
    setSpinning(true);
  }

  function pickCategory(c: CategoryId) {
    setSelectedSetId(null);
    setCategory(c);
    updateSettings({ lastCategory: c });
  }

  function submitSet(name: string, items: Menu[], id?: string) {
    if (id) updateSet({ id, name, items });
    else setSelectedSetId(addSet(name, items)); // 새 셋은 만들고 바로 선택
  }

  function removeSet(id: string) {
    deleteSet(id);
    if (selectedSetId === id) setSelectedSetId(null); // 선택 중이던 셋 삭제 → 카테고리 복귀
  }

  if (!loaded) return <div className="loading">불러오는 중…</div>;

  return (
    <div className="app">
      <header className="app-header">
        <h1>오늘 뭐먹지 슬롯</h1>
        <div className="header-actions">
          <button type="button" onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })} aria-pressed={settings.soundEnabled} aria-label="소리">
            {settings.soundEnabled ? '🔊' : '🔇'}
          </button>
          <button type="button" onClick={() => setShowHistory(true)} aria-label="이번 주 기록">📅</button>
        </div>
      </header>

      {!result && (
        <>
          <CategoryPicker value={selectedSetId ? 'all' : category} onChange={pickCategory} />
          <SetChips
            sets={customSets}
            selectedSetId={selectedSetId}
            onSelect={setSelectedSetId}
            onEdit={(s) => setEditing({ open: true, set: s })}
            onCreate={() => setEditing({ open: true, set: null })}
          />
          <button className="spin-btn" type="button" onClick={spin} disabled={spinning || !canSpin}>돌리기 🎰</button>
        </>
      )}

      <SlotMachine reels={reels} winnerIndex={winnerIndex} spinning={spinning} soundEnabled={settings.soundEnabled} onSpinEnd={() => setSpinning(false)} />

      {result && !spinning && (
        <ResultCard
          menu={result}
          isFavorite={favSet.has(result.id)}
          onEat={() => {
            if (!alreadyEatenToday(history, today)) {
              addHistory({ date: today, menuId: result.id, category: result.category, name: result.name, emoji: result.emoji });
            }
            setResult(null);
            setReels([]);
          }}
          onRespin={() => spin()}
          onToggleFav={() => toggleFavorite(result.id)}
          shareSlot={<ShareButton menu={result} />}
        />
      )}

      {showHistory && (
        <HistoryView history={history} today={today} onClose={() => setShowHistory(false)} />
      )}

      {editing.open && (
        <SetEditor
          initial={editing.set}
          onSubmit={submitSet}
          onDelete={removeSet}
          onClose={() => setEditing({ open: false, set: null })}
        />
      )}
    </div>
  );
}
