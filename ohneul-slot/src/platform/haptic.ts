import { generateHapticFeedback } from '@apps-in-toss/web-framework';

type HapticKind = 'tick' | 'success';
const TYPE_MAP: Record<HapticKind, 'tickWeak' | 'success'> = { tick: 'tickWeak', success: 'success' };

function webVibrate(kind: HapticKind): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(kind === 'success' ? [30, 40, 30] : 10); // 토스 밖 웹 폴백
  }
}

export function playHaptic(kind: HapticKind = 'tick'): void {
  try {
    const r = generateHapticFeedback({ type: TYPE_MAP[kind] });
    if (r && typeof (r as Promise<void>).catch === 'function') {
      (r as Promise<void>).catch(() => webVibrate(kind));
    }
  } catch {
    webVibrate(kind);
  }
}
