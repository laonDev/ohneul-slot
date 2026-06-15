// Web Audio 기반 경량 사운드 (에셋 없음). 음색/볼륨은 샌드박스에서 손맛 튜닝 대상.
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    return ctx;
  } catch {
    return null;
  }
}

type SoundKind = 'tick' | 'win';

export function playSound(kind: SoundKind): void {
  const c = getCtx();
  if (!c) return;
  try {
    if (c.state === 'suspended') void c.resume();
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    if (kind === 'win') {
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(990, now + 0.18);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.36);
    } else {
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.09);
    }
  } catch {
    /* 오디오 미지원/차단 시 무음 */
  }
}

// ── 스핀 중 "위잉" 루프음 ────────────────────────────────
let spinNodes: { osc: OscillatorNode; gain: GainNode; lfo: OscillatorNode; lfoGain: GainNode } | null = null;

export function startSpinLoop(): void {
  const c = getCtx();
  if (!c || spinNodes) return;
  try {
    if (c.state === 'suspended') void c.resume();
    const now = c.currentTime;
    const osc = c.createOscillator();   // 본음(모터 위잉)
    const gain = c.createGain();
    const lfo = c.createOscillator();   // 비브라토(위잉 텍스처)
    const lfoGain = c.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(170, now);
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(22, now); // 떨림 속도
    lfoGain.gain.setValueAtTime(14, now);  // 떨림 폭(±Hz)
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.08); // 페이드 인
    osc.connect(gain);
    gain.connect(c.destination);

    osc.start(now);
    lfo.start(now);
    spinNodes = { osc, gain, lfo, lfoGain };
  } catch {
    /* 무음 */
  }
}

export function stopSpinLoop(): void {
  if (!spinNodes) return;
  const c = getCtx();
  const nodes = spinNodes;
  spinNodes = null;
  try {
    const now = c ? c.currentTime : 0;
    nodes.gain.gain.cancelScheduledValues(now);
    nodes.gain.gain.setValueAtTime(Math.max(nodes.gain.gain.value, 0.0001), now);
    nodes.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1); // 페이드 아웃
    nodes.osc.stop(now + 0.12);
    nodes.lfo.stop(now + 0.12);
  } catch {
    /* 무음 */
  }
}
