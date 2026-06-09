import { share, getTossShareLink } from '@apps-in-toss/web-framework';
import type { Menu } from '../core/types';

const FALLBACK_LINK = 'https://apps-in-toss.toss.im/'; // 콘솔 발급 링크로 교체 가능

export async function shareResult(menu: Menu): Promise<void> {
  let link = FALLBACK_LINK;
  try { link = await getTossShareLink('/'); } catch { /* 토스 밖: 폴백 링크 */ }
  const message = `오늘 점심은 "${menu.name}" ${menu.emoji}\n나도 슬롯 돌려보기 👉 ${link}`;
  try {
    await share({ message });
  } catch {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      await navigator.share({ text: message }); // 웹 폴백
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(message); // 최종 폴백
    }
  }
}
