import { useEffect, useRef } from 'react';
import type { CustomSet } from '../core/types';

interface Props {
  sets: CustomSet[];
  selectedSetId: string | null;
  onSelect: (id: string) => void;
  onEdit: (set: CustomSet) => void;
  onCreate: () => void;
}

export function SetChips({ sets, selectedSetId, onSelect, onEdit, onCreate }: Props) {
  const timer = useRef<number | null>(null);
  const longFired = useRef(false);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const start = (s: CustomSet) => {
    longFired.current = false;
    timer.current = window.setTimeout(() => { longFired.current = true; onEdit(s); }, 500);
  };
  const clear = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  const click = (id: string) => {
    if (longFired.current) { longFired.current = false; return; } // 길게누르기 후 클릭 무시
    onSelect(id);
  };

  return (
    <div className="set-chips">
      {sets.map(s => (
        <button
          key={s.id}
          type="button"
          className={`chip chip--set ${selectedSetId === s.id ? 'chip--on' : ''}`}
          aria-pressed={selectedSetId === s.id}
          onClick={() => click(s.id)}
          onTouchStart={() => start(s)} onTouchEnd={clear} onTouchMove={clear}
          onMouseDown={() => start(s)} onMouseUp={clear} onMouseLeave={clear}
          onContextMenu={e => e.preventDefault()}
        >
          ⭐ {s.name}
        </button>
      ))}
      <button type="button" className="chip chip--add" onClick={onCreate}>+ 셋</button>
    </div>
  );
}
