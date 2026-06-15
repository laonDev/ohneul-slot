import type { Menu } from '../core/types';
import { menuImageUrl } from '../data/menuImages';

/**
 * 메뉴 아이콘. 이미지가 등록돼 있으면 <img>, 없으면 이모지 텍스트로 폴백한다.
 * 이모지 경로는 부모의 font-size를 그대로 상속(기존 렌더와 동일). size는 이미지 크기에만 적용.
 */
export function MenuIcon({ menu, size = 36 }: { menu: Menu; size?: number }) {
  const url = menuImageUrl(menu.id);
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
