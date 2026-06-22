import type { Menu } from '../core/types';
import { resolveMenuIconUrl } from '../data/menuImages';

/**
 * 메뉴 아이콘. 리졸버(전용→정규화매칭→카테고리→없음) 결과가 있으면 <img>,
 * 없으면 이모지 텍스트로 폴백한다. 이모지는 부모 font-size 상속(기존 렌더 동일).
 */
export function MenuIcon({ menu, size = 36 }: { menu: Menu; size?: number }) {
  const url = resolveMenuIconUrl(menu);
  if (url) {
    return (
      <img
        className="menu-icon"
        src={url}
        alt={menu.name}
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }
  return <>{menu.emoji}</>;
}
