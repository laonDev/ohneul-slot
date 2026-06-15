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
  // 아직 없음 — 준비되는 대로 id 추가
]);

export function menuImageUrl(id: string): string | null {
  if (!MENU_IMAGE_IDS.has(id)) return null;
  return `${import.meta.env.BASE_URL}menu/${id}.webp`;
}
