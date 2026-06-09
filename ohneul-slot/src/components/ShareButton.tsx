import type { Menu } from '../core/types';
import { shareResult } from '../platform/share';

export function ShareButton({ menu }: { menu: Menu }) {
  const handleShare = () => {
    shareResult(menu).catch(e => {
      if (import.meta.env?.DEV && !(e instanceof Error && e.name === 'AbortError')) {
        console.warn('[share]', e);
      }
    });
  };
  return (
    <button type="button" className="share-btn" onClick={handleShare}>
      결과 공유하기 📤
    </button>
  );
}
