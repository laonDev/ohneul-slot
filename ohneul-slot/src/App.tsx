import { useEffect, useMemo, useState } from 'react';
import { useAppState } from './store/useAppState';
import { getCandidates } from './core/menu';
import { pickThree } from './core/picker';
import { alreadyEatenToday } from './core/history-util';
import { CategoryPicker } from './components/CategoryPicker';
import { SlotMachine } from './components/SlotMachine';
import { ResultCard } from './components/ResultCard';
import { ShareButton } from './components/ShareButton';
import { HistoryView } from './components/HistoryView';
import type { CategoryId, Menu } from './core/types';

function todayStr(): string { return new Date().toISOString().slice(0, 10); } // UTC YYYY-MM-DD (HistoryView와 정합)

export default function App() {
  const { loaded, history, favorites, settings, addHistory, toggleFavorite, updateSettings } = useAppState();
  const [category, setCategory] = useState<CategoryId>('all');
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Menu | null>(null);
  const [reels, setReels] = useState<Menu[]>([]);
  const [winnerIndex, setWinnerIndex] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const today = todayStr();
  const favSet = useMemo(() => new Set(favorites), [favorites]);

  // 저장된 마지막 카테고리로 초기화
  useEffect(() => {
    if (loaded) setCategory(settings.lastCategory);
    // settings는 loaded 시점 1회만 반영
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  function spin() {
    const picked = pickThree(getCandidates(category), history, favSet, today, Math.random);
    if (!picked) return; // 후보가 비면 스핀하지 않음(현재 데이터에선 발생하지 않지만 방어)
    setReels(picked.reels);
    setWinnerIndex(picked.winnerIndex);
    setResult(picked.reels[picked.winnerIndex]);
    setSpinning(true);
  }

  function pickCategory(c: CategoryId) {
    setCategory(c);
    updateSettings({ lastCategory: c });
  }

  // 점심 알림은 콘솔 광고성(재방문/신규유입) 캠페인으로 처리 → 인앱 🔔 토글 임시 숨김.
  // 추후 기능성(매일 11:30 고정) 정식 구현 시 notify.ts의 enableLunchPush로 복구.

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
          <CategoryPicker value={category} onChange={pickCategory} />
          <button className="spin-btn" type="button" onClick={spin} disabled={spinning}>돌리기 🎰</button>
        </>
      )}

      <SlotMachine reels={reels} winnerIndex={winnerIndex} spinning={spinning} soundEnabled={settings.soundEnabled} onSpinEnd={() => setSpinning(false)} />

      {result && !spinning && (
        <ResultCard
          menu={result}
          isFavorite={favSet.has(result.id)}
          onEat={() => {
            if (!alreadyEatenToday(history, today)) {
              addHistory({ date: today, menuId: result.id, category: result.category });
            }
            setResult(null);
            setReels([]); // 슬롯 idle로
          }}
          onRespin={() => spin()}
          onToggleFav={() => toggleFavorite(result.id)}
          shareSlot={<ShareButton menu={result} />}
        />
      )}

      {showHistory && (
        <HistoryView history={history} today={today} onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
}
