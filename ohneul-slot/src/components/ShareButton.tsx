import type { Menu } from '../core/types';
import { shareResult } from '../platform/share';

export function ShareButton({ menu }: { menu: Menu }) {
  return (
    <button type="button" className="share-btn" onClick={() => shareResult(menu)}>
      결과 공유하기 📤
    </button>
  );
}
