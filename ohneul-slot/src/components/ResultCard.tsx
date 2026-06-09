import type { ReactNode } from 'react';
import type { Menu } from '../core/types';

interface Props {
  menu: Menu;
  isFavorite: boolean;
  onEat: () => void;
  onRespin: () => void;
  onToggleFav: () => void;
  shareSlot: ReactNode;
}

export function ResultCard({ menu, isFavorite, onEat, onRespin, onToggleFav, shareSlot }: Props) {
  return (
    <div className="result-card">
      <div className="result-emoji">{menu.emoji}</div>
      <div className="result-name">오늘은 <b>{menu.name}</b>!</div>
      <div className="result-actions">
        <button onClick={onEat}>먹었어요 기록</button>
        <button onClick={onRespin}>다시 돌리기</button>
        <button onClick={onToggleFav}>{isFavorite ? '⭐ 단골' : '☆ 단골 등록'}</button>
      </div>
      {shareSlot}
    </div>
  );
}
