import { useLayoutEffect, useRef } from 'react';
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
const EASING = 'cubic-bezier(.15,.85,.25,1)';

interface Props { result: Menu | null; spinning: boolean; onSpinEnd: () => void; soundEnabled?: boolean; }

export function SlotMachine({ result, spinning, onSpinEnd, soundEnabled = true }: Props) {
  const stripRefs = useRef<Array<HTMLDivElement | null>>([null, null, null]);
  // 부모가 onSpinEnd를 메모이즈하지 않아도 effect가 재실행되지 않도록 ref로 고정
  const onSpinEndRef = useRef(onSpinEnd);
  onSpinEndRef.current = onSpinEnd;

  // 트랜지션을 ref로 직접 제어한다. 상태 기반(setOffsets)은 재스핀 시
  // 0 리셋 프레임이 페인트되기 전에 목표로 덮여 트랜지션이 재시작되지 않는 경쟁이 있다.
  // 여기서는 (1) 트랜지션 없이 0으로 리셋 → (2) 강제 리플로우로 확정 → (3) 트랜지션으로 목표 이동.
  useLayoutEffect(() => {
    if (!spinning || !result) return;
    const strips = stripRefs.current;

    strips.forEach(el => {
      if (!el) return;
      el.style.transition = 'none';
      el.style.transform = 'translateY(0px)';
    });
    // 강제 리플로우: 0 리셋을 브라우저에 확정시켜 재스핀에서도 트랜지션이 다시 시작되게 함
    void strips[0]?.offsetHeight;
    strips.forEach((el, i) => {
      if (!el) return;
      el.style.transition = `transform ${REEL_STOP_MS[i]}ms ${EASING}`;
      el.style.transform = `translateY(-${FINAL_OFFSET}px)`;
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
    return () => timers.forEach(clearTimeout);
    // onSpinEnd는 ref로 처리하므로 deps에서 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, result, soundEnabled]);

  return (
    <div className="slot" style={{ height: ROW_H * VISIBLE_ROWS }}>
      {/* 가운데 히트라인 (2번째 줄) */}
      <div className="slot-hitline" style={{ top: ROW_H, height: ROW_H }} />
      {[0, 1, 2].map(i => (
        <div className="reel" key={i} style={{ height: ROW_H * VISIBLE_ROWS, overflow: 'hidden' }}>
          <div className="reel-strip" ref={el => { stripRefs.current[i] = el; }}>
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
