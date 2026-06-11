import { useEffect, useRef, useState } from 'react';
import type { Menu } from '../core/types';
import { playHaptic } from '../platform/haptic';
import { playSound } from '../platform/sound';

const STRIP_EMOJIS = ['🍚','🍜','🍕','🍣','🍔','🍱','🍢','🥘','🍗','🍙'];
const ROW_H = 64;          // px, 한 칸 높이
const VISIBLE_ROWS = 3;    // 보이는 줄 수 (가운데가 히트라인)
const STRIP_LEN = 40;      // 릴 한 줄당 칸 수
const WIN_INDEX = STRIP_LEN - 2; // 당첨 칸 위치(아래에 한 칸 여유를 두어 가운데 줄에 정렬)
// 칸 W가 가운데(2번째) 줄에 오려면 translateY(-offset)에서 offset = (W-1)*ROW_H
const FINAL_OFFSET = (WIN_INDEX - 1) * ROW_H;
const REEL_STOP_MS = [700, 1000, 1300]; // 릴별 정지 시각(순차 정지)

interface Props { result: Menu | null; spinning: boolean; onSpinEnd: () => void; soundEnabled?: boolean; }

export function SlotMachine({ result, spinning, onSpinEnd, soundEnabled = true }: Props) {
  const [offsets, setOffsets] = useState([0, 0, 0]);
  const [animating, setAnimating] = useState(false);
  // 부모가 onSpinEnd를 메모이즈하지 않아도 effect가 재실행/리셋되지 않도록 ref로 고정
  const onSpinEndRef = useRef(onSpinEnd);
  onSpinEndRef.current = onSpinEnd;

  useEffect(() => {
    if (!spinning || !result) return;
    // 먼저 0으로 리셋(트랜지션 없이) → 다음 프레임에 목표로 이동시켜 매 스핀마다 확실히 다시 움직이게 함
    setAnimating(false);
    setOffsets([0, 0, 0]);
    const raf = requestAnimationFrame(() => {
      setAnimating(true);
      // 세 릴 모두 동일한 최종 오프셋으로 정지 → 당첨 이모지가 가운데 히트라인에 정확히 안착
      setOffsets([FINAL_OFFSET, FINAL_OFFSET, FINAL_OFFSET]);
    });
    const timers = REEL_STOP_MS.map((ms, i) =>
      setTimeout(() => {
        playHaptic('tick');
        if (soundEnabled) playSound('tick');
        if (i === REEL_STOP_MS.length - 1) {
          playHaptic('success');
          if (soundEnabled) playSound('win');
          onSpinEndRef.current();
        }
      }, ms),
    );
    return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
    // onSpinEnd는 ref로 처리하므로 deps에서 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, result, soundEnabled]);

  return (
    <div className="slot" style={{ height: ROW_H * VISIBLE_ROWS }}>
      {/* 가운데 히트라인 (2번째 줄) */}
      <div className="slot-hitline" style={{ top: ROW_H, height: ROW_H }} />
      {[0, 1, 2].map(i => (
        <div className="reel" key={i} style={{ height: ROW_H * VISIBLE_ROWS, overflow: 'hidden' }}>
          <div
            className="reel-strip"
            style={{
              transform: `translateY(-${offsets[i]}px)`,
              transition: animating ? `transform ${REEL_STOP_MS[i]}ms cubic-bezier(.15,.85,.25,1)` : 'none',
            }}
          >
            {Array.from({ length: STRIP_LEN }, (_, r) => (
              <div className="reel-cell" key={r} style={{ height: ROW_H }}>
                {r === WIN_INDEX && result ? result.emoji : STRIP_EMOJIS[(r + i * 3) % STRIP_EMOJIS.length]}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
