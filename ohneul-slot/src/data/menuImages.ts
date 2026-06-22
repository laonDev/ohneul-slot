import type { Menu } from '../core/types';
import { findCanonicalMenu } from '../core/menuMatch';

// 메뉴 이미지(하이브리드) — 이미지가 준비된 메뉴만 여기 등록하면 그 메뉴는 이미지로,
// 나머지는 자동으로 이모지로 폴백된다(컴포넌트 수정 불필요).
//
// 이미지 추가 방법:
//   1) public/menu/<id>.webp 로 파일을 넣는다 (예: public/menu/k01.webp)
//   2) 아래 MENU_IMAGE_IDS 에 그 id 를 추가한다
//
// 권장 스펙: 256x256 WebP, 중앙 정렬, 단색/투명 배경의 플랫 일러스트(작은 릴에서도 또렷).
// 생성 프롬프트 예시(일관 스타일):
//   "flat vector food icon of <메뉴 한글명/영문명>, centered, top-down, simple solid
//    light background, no text, friendly minimal style, vibrant appetizing colors"

export const MENU_IMAGE_IDS = new Set<string>([
  'k01',
  'k02',
  'k03',
  'k04',
  'k05',
  'k06',
  'k07',
  'k08',
  'k09',
  'k10',
  'k11',
  'k12',
]);

export function menuImageUrl(id: string): string | null {
  if (!MENU_IMAGE_IDS.has(id)) return null;
  return `${import.meta.env.BASE_URL}menu/${id}.webp`;
}

// 카테고리 제너릭 아이콘(롱테일 폴백). 준비되면 public/menu/_cat-<category>.webp 추가 후 등록.
export const CATEGORY_IMAGE_CATS = new Set<string>([
  // 예: 'korean', 'chinese', ... (아직 없음 — 준비되면 추가)
]);

export function categoryImageUrl(category: string): string | null {
  if (!CATEGORY_IMAGE_CATS.has(category)) return null;
  return `${import.meta.env.BASE_URL}menu/_cat-${category}.webp`;
}

/**
 * 메뉴 아이콘 URL 해석(미래 대비 리졸버):
 *  1) 우리 세트에 있는 id의 전용 이미지
 *  2) 이름 정규화로 표준 메뉴 매칭 → 그 표준 메뉴의 이미지 (식당/사용자 추가 메뉴 커버)
 *  3) 카테고리 제너릭 이미지
 *  4) 없음(null) → 호출부에서 이모지 폴백
 */
export function resolveMenuIconUrl(menu: Menu): string | null {
  const direct = menuImageUrl(menu.id);
  if (direct) return direct;
  const canon = findCanonicalMenu(menu.name);
  if (canon) {
    const viaCanon = menuImageUrl(canon.id);
    if (viaCanon) return viaCanon;
  }
  return categoryImageUrl(menu.category);
}
