import { useEffect, useRef, useState } from 'react';
import type { Menu } from '../core/types';
import { playHaptic } from '../platform/haptic';

const STRIP_EMOJIS = ['🍚','🍜','🍕','🍣','🍔','🍱','🍢','🥘','🍗','🍙'];
const ROW_H = 64;     // px
const REEL_STOP_MS = [700, 1000, 1300];

interface Props { result: Menu | null; spinning: boolean; onSpinEnd: () => void; }

export function SlotMachine({ result, spinning, onSpinEnd }: Props) {
  const [offsets, setOffsets] = useState([0, 0, 0]);
  const endedRef = useRef(false);

  useEffect(() => {
    if (!spinning || !result) return;
    endedRef.current = false;
    const spins = [40, 46, 52].map(n => n * ROW_H);
    setOffsets(spins);
    const timers = REEL_STOP_MS.map((ms, i) =>
      setTimeout(() => {
        playHaptic('tick');
        if (i === 2) {
          playHaptic('success');
          if (!endedRef.current) { endedRef.current = true; onSpinEnd(); }
        }
      }, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [spinning, result, onSpinEnd]);

  return (
    <div className="slot">
      {[0, 1, 2].map(i => (
        <div className="reel" key={i} style={{ height: ROW_H * 3, overflow: 'hidden' }}>
          <div
            className="reel-strip"
            style={{
              transform: `translateY(-${offsets[i]}px)`,
              transition: spinning ? `transform ${REEL_STOP_MS[i]}ms cubic-bezier(.2,.8,.2,1)` : 'none',
            }}
          >
            {[...Array(60)].map((_, r) => (
              <div className="reel-cell" key={r} style={{ height: ROW_H }}>
                {r === 59 && result ? result.emoji : STRIP_EMOJIS[(r + i) % STRIP_EMOJIS.length]}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
