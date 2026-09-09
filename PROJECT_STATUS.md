# Weapon Reinforce - PROJECT STATUS

## 현재 기준선

- 현재 출시 버전: `1.1.0`
- 기본 브랜치: `master`
- 기준 커밋: `9e87b05973e212175fc2e683f35e0163ac1479a6`
- 1.1 기능 릴리스 커밋: `bb08723d4a05ab05f2153513dd9d64a68b4b933e`
- 공개 게임: https://luckybridge.github.io/weapon-reinforce/
- 런타임: React 19 + Vite 8, Node.js 22, npm 10.9.2
- 서버/계정: 없음. 브라우저 `localStorage` 자동 저장 + 버전형 JSON 파일 백업/복구를 사용한다.

이 문서는 **현재 배포되는 1.1 런타임 상태만** 기록한다. 2026년 6~7월의 폐기·검토 후보와 이전 구현 변천 기록은 [과거 PROJECT_STATUS 보관본](./docs/history/project-status-legacy-through-2026-07-12.md)에서 확인한다.

## 현재 플레이 루프

1. 9종 퀴즈팩의 문제를 풀어 엽전을 얻는다.
2. 타이밍 바를 멈춰 무기를 강화한다.
3. `K2 소총 → 월도 → 장도·쌍수도 → 환도 → 칠지도 → 한국식 동검 → 비파형동검`의 7단계 시간역행 트리를 진행한다.
4. 시간 균열 탐사에서 적·NPC·사건 조우를 해결한다.
5. 안전 귀환한 전리품으로 탐사 준비물을 제작·장착한다.
6. 탐사에서 목격한 시대와 무기 정보를 시간 기록관에서 복원한다.
7. +7 무기로 7층을 안전 귀환하면 시간 균열 완주 기록을 연다.

오래된 무기일수록 강해지는 규칙은 실제 무기 성능의 우열이 아니라 게임 안의 **역사 공명** 설정이다.

## 현재 런타임 구성

### 무기 강화

- 7단계 단일 강화 트리
- 단계별 강화 비용·성공률
- 터치·마우스·Enter·Space 타이밍 입력
- GOOD/PERFECT 판정에 따른 성공 확률 보정
- 강화 실패 시 +1 K2 복귀
- 확률형 괴작 12종
- 괴작 발견·보유·판매·중복 일괄 판매
- 평생 최고 성공 단계 기준 복원 무기고

### 퀴즈 경제

- 9팩, 762문항
- 텍스트 및 SVG 보기형 문제
- 팩별 보상과 정답·오답·연속 정답·누적 통계
- `public/quiz/weapon-reinforce-manifest.json`에 출처 스냅샷을 기록
- 다른 프로젝트 파일을 런타임에서 직접 읽지 않는 독립 snapshot 구조

### 시간 균열 탐사

- 3개 지역, 7개 역사층
- 적 6종, NPC 3종, 사건 3종
- 첫 조우와 마지막 조우는 적으로 고정
- 중간 조우는 유형 우선 추첨: 적 60% / NPC 23% / 사건 17%
- 최근 2개 ID 반복 회피
- 적 2연속 뒤 도움 조우 보장
- 플레이어 공격 → 적 공격 예고 → 적 공격 자동 교대전투
- 적별 역할·방어·체력/공격 보정·강공 패턴
- NPC/사건의 회복·다음 공격·다음 방어·전리품 조사 효과
- 임시 명성·기록 조각·가상 전리품과 안전 귀환 정산
- 사망 시 임시 보상 손실, 최대 200냥 범위 패널티, 강화 단계 보존

### 탐사 경제

- 가상 전리품 6종
- 지역별 드롭 표 7종
- 준비물 3종
- 전리품 + 퀴즈 엽전으로 준비물 제작
- 다음 탐사에 준비물 1개 장착·소비
- 정산/거래 ID를 통한 중복 적용 방지

### 저장·복구

자동 저장과 휴대 가능한 백업을 함께 사용한다.

- `localStorage` 자동 체크포인트
- 진행 중 탐사의 HP, 깊이, 조우, 난수, 임시 보상, 남은 효과까지 저장
- 새로고침 뒤 동일 탐사 재개
- JSON 저장 파일 내보내기/불러오기
- 저장 파일 버전·생성 시각·체크섬 포함
- 게임 소유 key allowlist
- 1MB 상한
- 손상·변조·미지원 버전·허용되지 않은 key 거부
- 저장 교체 실패 시 기존 진행 롤백
- 로컬 저장 차단/용량 부족 시 사용자 안내

### 역사·교육 정보

- 7개 역사층을 무기 데이터의 시대·용도·고증과 연결
- 초등학생이 읽기 쉬운 짧은 사실과 생각 질문 제공
- 해당 층을 먼저 목격한 뒤 기록 조각을 사용해야 전체 카드 복원
- 전투용 가상 존재와 역사 정보를 구분
- 게임 설정과 실제 역사적 사실을 구분하는 문구 유지

## 현재 소스 기준

### 앱

- `src/App.jsx`
- `src/index.css`
- `src/App.css`

### 주요 컴포넌트

- `src/components/ExpeditionModal.jsx`
- `src/components/ExpeditionWorkshopModal.jsx`
- `src/components/HistoryArchiveModal.jsx`
- `src/components/SaveManagerModal.jsx`

### 데이터·상태 로직

- `src/data/weaponTimeline.js`
- `src/data/quizCatalog.js`
- `src/data/expeditionCatalog.js`
- `src/data/expedition.js`
- `src/data/expeditionEconomy.js`
- `src/data/gameSave.js`
- `src/data/safeStorage.js`

### 배포·검증

- `.github/workflows/deploy.yml`
- `.github/workflows/ci.yml`
- `scripts/prepare-runtime-public.mjs`
- `scripts/validate-weapon-timeline.mjs`
- `scripts/validate-quiz-catalog.mjs`
- `scripts/validate-save-state.mjs`
- `scripts/validate-game-save.mjs`
- `scripts/validate-expedition.mjs`
- `scripts/validate-expedition-economy.mjs`
- `scripts/simulate-game-balance.mjs`
- `scripts/validate-runtime-assets.mjs`

## 자동 출시 게이트

전체 출시 검증은 다음 한 명령으로 실행한다.

```bash
npm run validate:all
```

실행 순서는 다음과 같다.

1. `validate:weapons`
2. `validate:quizzes`
3. `validate:saves`
4. `validate:save-file`
5. `validate:economy`
6. `validate:expedition`
7. `validate:balance`
8. `lint`
9. `build`
10. `validate:runtime`

PR 검증 워크플로와 GitHub Pages 배포 워크플로 모두 `npm run validate:all`을 게이트로 사용한다.

## 1.1 릴리스 검증 상태

2026-07-12의 1.1 릴리스 기준으로 다음 자동·브라우저 검증이 완료된 상태이다.

- [x] 무기 데이터 및 강화 규칙
- [x] 9팩 762문항과 SVG 참조
- [x] 손상된 로컬 저장 복구
- [x] JSON 저장 파일 경계와 rollback
- [x] 탐사 조우·전투·상태 이관
- [x] 전리품·준비물·거래·정산 중복 방지
- [x] 강화/탐사 밸런스 시뮬레이션
- [x] ESLint
- [x] 프로덕션 빌드
- [x] 런타임 asset allowlist
- [x] 데스크톱·768px급 태블릿·390px급 모바일 주요 플레이 흐름
- [x] 프로덕션 미리보기의 콘솔 오류/경고 및 깨진 이미지 점검

세부 검증 항목은 [CHECKLIST.md](./CHECKLIST.md)를 기준으로 한다.

## 현재 알려진 확인 항목

현재 코드 기준으로 자동 검증에서 남은 기능 TODO는 없다. 다만 배포 전 다음 수동 왕복은 계속 확인한다.

- [ ] 실제 OS 파일 선택 창에서 동일 JSON 저장 파일을 선택해 불러오는 최종 UI 왕복
- [ ] 변경이 있는 경우 데스크톱·태블릿·390px 모바일에서 변경된 흐름 재확인

## 2026-09-09 저장소 기준선 정리

- 현재 배포 코드에 존재하지 않는 토끼·자라 모험 후보, `adventureApprovedStories.js`, `validate:adventure`, `smoke:adventure` 등의 과거 기록을 현재 상태에서 분리했다.
- 기존 `PROJECT_STATUS.md` 전체 내용은 `docs/history/project-status-legacy-through-2026-07-12.md`에 보존했다.
- 현재 문서는 README, AGENTS, CHECKLIST, package.json, 실제 `src/` 트리와 일치하도록 다시 작성했다.
- 소스 전체에서 참조되지 않는 Vite 기본 잔여 asset `src/assets/react.svg`, `src/assets/vite.svg`를 제거했다.
- `master` 대상 PR에서 `npm run validate:all`을 자동 실행하는 `.github/workflows/ci.yml`을 추가했다.
- 이 정리는 런타임 게임 동작·데이터·배포 설정을 변경하지 않는다.

## 다음 개발 우선순위

### P0 — 1.1 기준선 보존

- 기능 변경 전 `npm run validate:all`을 기본 게이트로 유지한다.
- 현재 serverless 저장 및 JSON 백업 구조를 유지한다.
- 퀴즈 원본 프로젝트를 런타임 의존성으로 다시 연결하지 않는다.
- 과거 토끼·자라 런타임을 현재 앱에 재도입하지 않는다.

### P1 — App.jsx 책임 축소

현재 `App.jsx`가 강화, 퀴즈, 저장, 탐사, 괴작, 도감, 음향, 화면 모드와 애니메이션 상태를 함께 관리한다. 기능을 재설계하지 않고 다음 단위부터 점진적으로 분리하는 것이 다음 구조 개선 후보이다.

- 강화 상태·입력
- 퀴즈 세션
- 탐사 상태·정산
- 저장 실패 및 백업 경계

분리는 기존 데이터 API와 검증 스크립트를 유지하는 범위에서 진행한다.

### P2 — 콘텐츠 확장

구조 개선 뒤 다음 항목을 독립적으로 확장할 수 있다.

- 적/NPC/사건 다양화
- 무기별 전투 개성 조정
- 역사 기록 카드 확장
- 탐사 준비물 다양화
- 밸런스 재시뮬레이션

새 콘텐츠는 기존 `validate:expedition`, `validate:economy`, `validate:balance`, `validate:runtime`에 검증 조건을 함께 추가한다.

## 릴리스 원칙

- `master` 직접 기능 개발보다 작업 브랜치와 PR을 우선한다.
- PR 단계에서 자동 `validate:all`을 통과하고, 배포 전에도 동일 게이트를 통과한다.
- 기능·UI 변경 시 영향을 받은 데스크톱/태블릿/모바일 흐름을 다시 확인한다.
- `PROJECT_STATUS.md`에는 현재 상태만 남기고, 장기 개발 이력은 `docs/history/`로 이동한다.
- 라이선스 선택은 별도 정책 결정 사항이므로 임의로 추가하지 않는다.
