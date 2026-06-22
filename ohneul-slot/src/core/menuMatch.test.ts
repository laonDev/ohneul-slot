import { describe, it, expect } from 'vitest';
import { normalizeMenuName, findCanonicalMenu } from './menuMatch';

describe('normalizeMenuName', () => {
  it('strips spaces and qualifiers', () => {
    expect(normalizeMenuName('얼큰 김치찌개')).toBe('김치찌개');
    expect(normalizeMenuName('엄마손김치찌개')).toBe('김치찌개');
    expect(normalizeMenuName('김치찌개(2인)')).toBe('김치찌개');
  });
  it('keeps unknown names mostly intact', () => {
    expect(normalizeMenuName('김치찌개')).toBe('김치찌개');
  });
});

describe('findCanonicalMenu', () => {
  it('maps a modified name to the canonical menu (exact after normalize)', () => {
    expect(findCanonicalMenu('얼큰김치찌개')?.name).toBe('김치찌개');
  });
  it('maps an unknown variant via substring containment', () => {
    // '회사앞국밥'은 풀에 없지만 '국밥'을 포함 → 국밥으로 매핑
    expect(findCanonicalMenu('회사앞국밥')?.name).toBe('국밥');
  });
  it('matches an exact known menu', () => {
    expect(findCanonicalMenu('비빔밥')?.name).toBe('비빔밥');
  });
  it('returns null for a truly unknown menu', () => {
    expect(findCanonicalMenu('존재하지않는메뉴zzz')).toBeNull();
  });
});
