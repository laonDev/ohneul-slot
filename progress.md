# 오늘 뭐먹지 슬롯 — 진행 상황 (Progress)

> 앱인토스 6월 바이브코딩 챌린지 출품작. 최종 업데이트: **2026-06-30**
> 상태: **✅ 번들 검수 승인 — "출시하기" 단계** (7/1 AU 집계 시작)

---

## 1. 한눈에 보기

| 항목 | 내용 |
|------|------|
| 앱 이름 | 오늘 뭐먹지 슬롯 (Lunch Slot) |
| appName | `ohneul-slot-1` (콘솔 등록값, 변경 불가) |
| 한 줄 | 점심 메뉴를 슬롯머신으로 5초에 정하는 미니앱 |
| 테마 | "일상이 편해지는 순간" — 반복되는 점심 결정 피로 자동화 |
| 방식 | 앱인토스 WebView 미니앱 |
| 저장소 | `/Users/kimgyubeom/workspace/toss-challenge` (앱: `ohneul-slot/`) |
| 커밋 수 | 43 (2026-06-09 ~ 06-24) |

### 챌린지 일정
- 출품: ~6/30 (콘솔 첫 빌드 제출) — **완료**
- 1차 심사: **7/1~7/26 활성 사용자 수(AU)** ← 핵심 지표
- 최종 심사: 테마 적합성·완성도·UX
- 상금: 1등 300만 / 2등 150만×2 / 3등 50만×5

---

## 2. 현재 상태: 번들 검수 대기

- [x] `.ait` 빌드 + 배포 (`ohneul-slot-1.ait`, 4.3MB)
- [x] 콘솔 정보·자산 입력 (로고/썸네일/스크린샷/설명/키워드)
- [x] 챌린지 신청폼 작성
- [x] **앱 정보 승인됨**
- [x] 앱 출시 메뉴에 번들 등록 + 출시 노트 + 앱 내 기능("점심 메뉴 추천", `intoss://ohneul-slot-1`)
- [x] **번들 검토 요청 완료** (6/26)
- [x] **검수 승인** (6/30) ✅
- [ ] 콘솔 **"출시하기"** 클릭 → 출시 (← 지금 할 일)
- [ ] 7/1~7/26 AU 집계 + 공유/바이럴로 사용자 모으기

### 푸시/알림 전략 (정정)
- 점심 알림은 **리텐션/마케팅 → 광고성**이라, 스마트 발송 **광고성 캠페인**(신규 유입 유도 + 재방문 유도)으로 처리(코드 0, 자동 검수). 캠페인 세팅 완료.
- 인앱 🔔 토글(기능성 동의)은 불필요 → **임시 숨김 처리(v2)**. 복구용 코드는 `platform/notify.ts`에 보존.
- (옵션) 매일 11:30 고정 알림을 원하면 기능성 동의문 + v2로 별도 구현 가능.

---

## 3. 진행 타임라인

| 날짜 | 마일스톤 |
|------|----------|
| 06-09 | 설계 문서·구현 계획 작성 → 스캐폴딩 → TDD로 코어/플랫폼/UI 전 구현, MVP를 main에 병합 |
| 06-11 | 슬롯 당첨 정렬·히트라인·재스핀 애니메이션 버그 수정 (실기기 튜닝 시작) |
| 06-15 | 슬롯 연출 개편(3후보→1당첨 셀렉터), 메뉴 이미지 하이브리드 구조 + Recraft 생성 스크립트 |
| 06-22 | 메뉴 이미지 리졸버(미래 대비) + 정규화 매칭, 카테고리 제너릭 8종, 투명배경 |
| 06-24 | 앱 아이콘·썸네일·스크린샷 제작, 콘솔 제출 문구, `.ait` 빌드·배포, **출품 완료** |

---

## 4. 기술 스택

- **프레임워크**: React 19 + Vite 6 + TypeScript
- **플랫폼**: `@apps-in-toss/web-framework` 2.6 (`granite dev` / `ait build` / `ait deploy`)
- **테스트**: Vitest (순수 로직)
- **빌드 산출물**: `.ait` (RN 0.84 / 0.72 번들 + 웹 자산)

---

## 5. 아키텍처 (모듈 경계)

```
src/
├── data/         정적 데이터 — menus(246) / categories / menuImages(매니페스트+리졸버)
├── core/         순수 로직(플랫폼/React 無, Vitest 대상)
│   ├── menu        카테고리 필터
│   ├── picker      확률 가중치 추첨 + pickThree(3후보→1당첨)
│   ├── history-util 주간 집계·중복 판정·날짜 수학(UTC)
│   └── menuMatch   이름 정규화 + 표준 메뉴 매칭(식당/사용자 메뉴 대비)
├── platform/     앱인토스 API 격리 — storage / haptic / sound / share / notify
├── store/        useAppState (history/favorites/settings 영속화)
└── components/   SlotMachine · MenuIcon · CategoryPicker · ResultCard · ShareButton · HistoryView
```

원칙: `core/`는 순수(테스트 용이), 플랫폼 API는 `platform/`에만 격리(폴백 내장).

---

## 6. 구현 기능

### 코어 슬롯
- **3후보 → 1당첨 셀렉터**: 세 릴이 서로 다른 후보(가중 당첨 1 + 미끼 2)에 순차 정지 → 0.3초 뜸 → 셀렉터가 가운데 히트 셀을 좌우로 이동, 마지막 불규칙 감속으로 당첨에 안착 → 당첨 팝(글로우+펄스)
- **하향 스핀**: 당첨 이모지가 위에서 내려와 가운데 히트라인에 정확히 안착
- **연출**: rAF 기반, 재스핀 안정(강제 리플로우), 햅틱·사운드(tick/win), 사운드/푸시 토글

### 추첨 (차별화)
- **확률 가중치**: 최근 먹은 메뉴↓(recency decay), 즐겨찾기↑(boost) → "또 같은 거" 방지
- 메뉴풀 **246종** (한식 60 + 6개 카테고리 각 31), 카테고리 8종

### 리텐션 / 바이럴
- **주간 히스토리** + 중복 방지, **즐겨찾기**(단골)
- **결과 공유**(토스 딥링크), **점심 푸시 동의**(평일 알림)

### 이미지 시스템 (하이브리드)
- `MenuIcon` + `resolveMenuIconUrl` **4단계 폴백**: 전용 이미지 → 이름 정규화 매칭 → 카테고리 제너릭 → 이모지
- Recraft V3 생성 파이프라인: `scripts/gen-menu-images.mjs` (묘사 기반 프롬프트 `menu-prompts.json`, 투명배경 removeBackground, 매니페스트 자동 동기화)
- 현재 **한식 12종 + 카테고리 제너릭 8종** 생성. 식당 연동·사용자 추가 메뉴까지 구조적으로 대비.

---

## 7. 출시 자산 (`ohneul-slot/brand/`)

| 자산 | 파일 | 생성 스크립트 |
|------|------|---------------|
| 앱 아이콘 | `app-icon-600.png` / `1024` | `scripts/gen-app-icon.mjs` |
| 썸네일 | `thumbnail-1932x828.png` | `scripts/gen-thumbnail.mjs` |
| 스크린샷 | `screenshots/01-spin.png` · `02-result.png` · `featured.png` | `scripts/gen-featured-shot.mjs` |
| 콘솔 문구 | `docs/console-submission.md` | — |

---

## 8. 품질

- **Vitest 31개 통과** (history-util / picker / pickThree / menu / categories / menus / menuMatch / storage)
- `tsc --noEmit` 클린, `vite build` 정상
- 서브에이전트 주도 개발 + 스펙/코드품질 2단계 리뷰로 구현(재스핀 무동작·공유 unhandled rejection·setState 부수효과 등 실버그 수정)

---

## 9. 후속 작업 후보 (출시 후)

- [ ] 검수 통과 확인 → 7월 AU 모니터링
- [ ] **전체 246개 메뉴 이미지 생성** (현재 12개) — Recraft `style_id` 고정 후 점진 교체. 하이브리드라 출시는 막지 않음.
- [ ] **7월 업데이트**: 위치 기반 주변 식당 · "같이 돌리기" 비동기 룸 → AU 부스트
- [ ] 공유/바이럴 강화

---

## 10. 문서

- 설계: `docs/superpowers/specs/2026-06-09-오늘-뭐먹지-슬롯-design.md`
- 구현 계획: `docs/superpowers/plans/2026-06-09-오늘-뭐먹지-슬롯.md`
- 콘솔 제출: `docs/console-submission.md`
