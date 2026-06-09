import { generateHapticFeedback } from '@apps-in-toss/web-framework';

type HapticKind = 'tick' | 'success';
const TYPE_MAP: Record<HapticKind, 'tickWeak' | 'success'> = { tick: 'tickWeak', success: 'success' };

export function playHaptic(kind: HapticKind = 'tick'): void {
  try {
    void generateHapticFeedback({ type: TYPE_MAP[kind] });
  } catch {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(kind === 'success' ? [30, 40, 30] : 10); // 토스 밖 웹 폴백
    }
  }
}
