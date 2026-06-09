import { useEffect, useRef, useState } from 'react';
import type { Menu } from '../core/types';
import { playHaptic } from '../platform/haptic';

const STRIP_EMOJIS = ['🍚','🍜','🍕','🍣','🍔','🍱','🍢','🥘','🍗','🍙'];
const ROW_H = 64;     // px
const REEL_STOP_MS = [700, 1000, 1300];
const BASE_SPINS = [40, 46, 52];

interface Props { result: Menu | null; spinning: boolean; onSpinEnd: () => void; }

export function SlotMachine({ result, spinning, onSpinEnd }: Props) {
  const [offsets, setOffsets] = useState([0, 0, 0]);
  const [animating, setAnimating] = useState(false);
  // 부모가 onSpinEnd를 메모이즈하지 않아도 effect가 재실행/리셋되지 않도록 ref로 고정
  const onSpinEndRef = useRef(onSpinEnd);
  onSpinEndRef.current = onSpinEnd;
  const spinCountRef = useRef(0);

  useEffect(() => {
    if (!spinning || !result) return;
    spinCountRef.current += 1;
    const round = spinCountRef.current;
    // 먼저 0으로 리셋(트랜지션 없이) → 다음 프레임에 목표로 이동시켜 매 스핀마다 확실히 움직이게 함
    setAnimating(false);
    setOffsets([0, 0, 0]);
    const raf = requestAnimationFrame(() => {
      setAnimating(true);
      setOffsets(BASE_SPINS.map(n => (n + round) * ROW_H)); // round로 매번 다른 값 보장
    });
    const timers = REEL_STOP_MS.map((ms, i) =>
      setTimeout(() => {
        playHaptic('tick');
        if (i === 2) {
          playHaptic('success');
          onSpinEndRef.current();
        }
      }, ms),
    );
    return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
    // onSpinEnd는 ref로 처리하므로 deps에서 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, result]);

  return (
    <div className="slot">
      {[0, 1, 2].map(i => (
        <div className="reel" key={i} style={{ height: ROW_H * 3, overflow: 'hidden' }}>
          <div
            className="reel-strip"
            style={{
              transform: `translateY(-${offsets[i]}px)`,
              transition: animating ? `transform ${REEL_STOP_MS[i]}ms cubic-bezier(.2,.8,.2,1)` : 'none',
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
