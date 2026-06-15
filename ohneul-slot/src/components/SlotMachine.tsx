import { useLayoutEffect, useRef, useState } from 'react';
import type { Menu } from '../core/types';
import { playHaptic } from '../platform/haptic';
import { playSound } from '../platform/sound';
import { MenuIcon } from './MenuIcon';

const STRIP_EMOJIS = ['🍚','🍜','🍕','🍣','🍔','🍱','🍢','🥘','🍗','🍙'];

// ── 튜닝 노브 ─────────────────────────────────────────────
const ROW_H = 64;            // 한 칸 높이(px)
const VISIBLE_ROWS = 3;      // 보이는 줄 수 (가운데가 히트라인)
const TRAVEL_CELLS = 50;     // 스핀 동안 지나가는 칸 수 (회전감)
const WIN_INDEX = 2;         // 당첨 칸 위치(위쪽). 위 칸들이 내려오며 라인에 안착
const SPIN_MS = [800, 1050, 1300]; // 릴별 스핀 시간 (후보 3개 순차 공개)
const OVERSHOOT_PX = 30;     // 정지 시 바운스 크기
const SEL_DELAY_MS = 300;    // 릴 모두 정지 후 셀렉터 시작까지 딜레이
const SEL_MIN_HOPS = 11;     // 셀렉터 최소 이동 횟수
const SEL_BASE_GAP = 70;     // 셀렉터 시작 간격(ms, 빠름)
const SEL_MAX_GAP = 300;     // 셀렉터 끝 간격(ms, 느림 = 두구두구)
const SEL_DRAMA_MUL = [1.4, 2.1, 3.2]; // 남은 이동 3·2·1회일 때 간격 배수(마지막일수록 김)
const SEL_DRAMA_JITTER = 160; // 마지막 구간 불규칙 가산(ms) — 매번 타이밍 달라짐
// ──────────────────────────────────────────────────────────

const REEL_COUNT = 3;
const REEL_W = 72;   // .reel 너비(px) — CSS와 일치
const REEL_GAP = 8;  // .slot gap(px) — CSS와 일치
const STRIP_LEN = WIN_INDEX + TRAVEL_CELLS + 4;
const FINAL_Y = -(WIN_INDEX - 1) * ROW_H;
const TRAVEL = TRAVEL_CELLS * ROW_H;
const START_Y = FINAL_Y - TRAVEL;

function easeOutQuart(u: number): number { return 1 - Math.pow(1 - u, 4); }
function bounce(u: number): number {
  if (u < 0.82) return 0;
  const t = (u - 0.82) / 0.18;
  return OVERSHOOT_PX * Math.sin(t * Math.PI * 2) * (1 - t);
}

interface Props {
  reels: Menu[];        // 릴별 메뉴(당첨 1 + 미끼 2)
  winnerIndex: number;  // 셀렉터가 안착할 릴
  spinning: boolean;
  onSpinEnd: () => void;
  soundEnabled?: boolean;
}

export function SlotMachine({ reels, winnerIndex, spinning, onSpinEnd, soundEnabled = true }: Props) {
  const stripRefs = useRef<Array<HTMLDivElement | null>>([null, null, null]);
  const onSpinEndRef = useRef(onSpinEnd);
  onSpinEndRef.current = onSpinEnd;
  const timersRef = useRef<number[]>([]);

  const [selectorPos, setSelectorPos] = useState<number | null>(null);
  const [landed, setLanded] = useState(false);

  // 홈으로 돌아가면(후보 비움) 슬롯을 idle 상태로 리셋
  useLayoutEffect(() => {
    if (reels.length > 0) return;
    setSelectorPos(null);
    setLanded(false);
    stripRefs.current.forEach(el => {
      if (el) { el.style.transition = 'none'; el.style.transform = 'translateY(0px)'; }
    });
  }, [reels]);

  useLayoutEffect(() => {
    if (!spinning || reels.length === 0) return;
    const strips = stripRefs.current;
    const stopped = [false, false, false];
    let startTs = 0;
    let rafId = 0;
    let selectorStarted = false;
    setSelectorPos(null);
    setLanded(false);

    // 시작 위치(위로 올림)
    strips.forEach(el => {
      if (!el) return;
      el.style.transition = 'none';
      el.style.transform = `translateY(${START_Y}px)`;
    });

    // ── Phase 2: 셀렉터가 좌우로 움직이다 당첨에 안착 ──
    const startSelector = () => {
      let T = SEL_MIN_HOPS;
      while (T % REEL_COUNT !== winnerIndex) T++; // T번째 이동이 winnerIndex에 떨어지도록
      setSelectorPos(0);
      let k = 0;
      const hop = () => {
        k += 1;
        setSelectorPos(k % REEL_COUNT);
        const isFinal = k >= T;
        playHaptic(isFinal ? 'success' : 'tick');
        if (soundEnabled) playSound(isFinal ? 'win' : 'tick');
        if (isFinal) {
          setLanded(true);
          onSpinEndRef.current();
          return;
        }
        let gap = SEL_BASE_GAP + (SEL_MAX_GAP - SEL_BASE_GAP) * Math.pow(k / (T - 1), 2);
        const hopsLeft = T - k; // 앞으로 남은 이동 수
        if (hopsLeft <= 3) {
          // 마지막 3번은 점점 길고 불규칙하게 → 거의 멈출 듯 들쭉날쭉
          gap = gap * SEL_DRAMA_MUL[3 - hopsLeft] + Math.random() * SEL_DRAMA_JITTER;
        }
        timersRef.current.push(window.setTimeout(hop, gap));
      };
      timersRef.current.push(window.setTimeout(hop, SEL_BASE_GAP));
    };

    // ── Phase 1: 릴 스핀(각 릴이 자기 후보에 정지) ──
    const frame = (ts: number) => {
      if (!startTs) startTs = ts;
      const elapsed = ts - startTs;
      let allDone = true;
      for (let i = 0; i < REEL_COUNT; i++) {
        const el = strips[i];
        if (!el) continue;
        const D = SPIN_MS[i];
        if (elapsed >= D) {
          if (!stopped[i]) {
            stopped[i] = true;
            el.style.transform = `translateY(${FINAL_Y}px)`;
            playHaptic('tick');
            if (soundEnabled) playSound('tick');
          }
          continue;
        }
        allDone = false;
        const u = elapsed / D;
        el.style.transform = `translateY(${START_Y + TRAVEL * easeOutQuart(u) + bounce(u)}px)`;
      }
      if (allDone) {
        if (!selectorStarted) {
          selectorStarted = true;
          timersRef.current.push(window.setTimeout(startSelector, SEL_DELAY_MS)); // 0.3초 뜸 들이고 시작
        }
        return;
      }
      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafId);
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
    // onSpinEnd는 ref로 처리하므로 deps에서 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, reels, winnerIndex, soundEnabled]);

  const selecting = selectorPos !== null;

  return (
    <div className="slot" style={{ height: ROW_H * VISIBLE_ROWS }}>
      <div className="slot-hitline" style={{ top: ROW_H, height: ROW_H }} />
      {[0, 1, 2].map(i => {
        const sel = selecting && !landed && selectorPos === i;
        const win = landed && i === winnerIndex;
        const dim = selecting && !sel && !win;
        const menu = reels[i];
        return (
          <div
            key={i}
            className={`reel${selecting ? ' reel--masked' : ''}`}
            style={{ height: ROW_H * VISIBLE_ROWS, overflow: 'hidden' }}
          >
            <div className="reel-strip" ref={el => { stripRefs.current[i] = el; }}>
              {Array.from({ length: STRIP_LEN }, (_, r) => (
                <div className="reel-cell" key={r} style={{ height: ROW_H }}>
                  {r === WIN_INDEX && menu ? <MenuIcon menu={menu} size={44} /> : STRIP_EMOJIS[(r + i * 3) % STRIP_EMOJIS.length]}
                </div>
              ))}
            </div>
            {/* 가운데 히트 셀 강조(릴 전체가 아니라 가운데만) */}
            <div
              className={`reel-center${sel ? ' reel-center--sel' : ''}${win ? ' reel-center--win' : ''}${dim ? ' reel-center--dim' : ''}`}
              style={{ top: ROW_H, height: ROW_H }}
            />
          </div>
        );
      })}
      {/* 당첨 팝 오버레이 (릴 overflow에 잘리지 않게 슬롯 위에 큰 이모지가 burst) */}
      {landed && reels[winnerIndex] && (
        <div
          className="slot-winner"
          style={{
            left: '50%',
            top: ROW_H + ROW_H / 2,
            transform: `translate(-50%, -50%) translateX(${(winnerIndex - 1) * (REEL_W + REEL_GAP)}px)`,
          }}
        >
          <span className="slot-winner-emoji"><MenuIcon menu={reels[winnerIndex]} size={56} /></span>
        </div>
      )}
    </div>
  );
}
