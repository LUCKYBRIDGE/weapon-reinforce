# Weapon Reinforce - PROJECT STATUS

## 현재 기준선

- 현재 릴리스 후보: `1.2.0`
- 기본 브랜치: `master`
- 1.1 기능 릴리스 커밋: `bb08723d4a05ab05f2153513dd9d64a68b4b933e`
- P1 구조 개선 완료 커밋: `b5e823a11dc57eced260d135ef409208c50f762e`
- 공개 게임: https://luckybridge.github.io/weapon-reinforce/
- 런타임: React 19 + Vite 8, Node.js 22, npm 10.9.2
- 서버/계정: 없음. 브라우저 `localStorage` 자동 저장 + 버전형 JSON 파일 백업/복구를 사용한다.

이 문서는 **현재 master에 준비 중인 1.2.0 릴리스 후보 상태만** 기록한다. 2026년 6~7월의 폐기·검토 후보와 이전 구현 변천 기록은 [과거 PROJECT_STATUS 보관본](./docs/history/project-status-legacy-through-2026-07-12.md)에서 확인한다.

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
- 적 7종, NPC 6종, 사건 6종
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

### 훅

- `src/hooks/useQuizSession.js`: 문제팩 선택·로딩, 세션/누적 통계, 오답 대기 타이머, 퀴즈 통계 저장
- `src/hooks/useEnhancementSession.js`: 강화 연출 상태, 타이밍 입력·판정, 타격/입자/플래시 효과
- `src/hooks/useExpeditionSession.js`: 탐사 run/stats/economy, 자동 진행, 귀환·패배 정산, settled 복구, 준비물 거래·장착
- `src/hooks/useGameStorage.js`: 저장 실패 감지, 저장 관리자 상태, JSON 저장 파일 내보내기·불러오기

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

현재 코드 기준으로 자동 검증에서 남은 기능 TODO는 없다. 1.2.0 태그 전 다음 수동 게이트 3건만 남아 있다.

- [ ] 실제 OS 파일 선택 창에서 동일 JSON 저장 파일을 선택해 불러오는 최종 UI 왕복
- [ ] 실제 390px 브라우저에서 선택형 지원 조우의 터치 선택과 가로 넘침 재확인
- [ ] 실제 데스크톱·390px 브라우저에서 전투 피드백 배지가 HP·대사창을 가리지 않는지 재확인

## 2026-09-09 저장소 기준선 정리

- 현재 배포 코드에 존재하지 않는 토끼·자라 모험 후보, `adventureApprovedStories.js`, `validate:adventure`, `smoke:adventure` 등의 과거 기록을 현재 상태에서 분리했다.
- 기존 `PROJECT_STATUS.md` 전체 내용은 `docs/history/project-status-legacy-through-2026-07-12.md`에 보존했다.
- 현재 문서는 README, AGENTS, CHECKLIST, package.json, 실제 `src/` 트리와 일치하도록 다시 작성했다.
- 소스 전체에서 참조되지 않는 Vite 기본 잔여 asset `src/assets/react.svg`, `src/assets/vite.svg`를 제거했다.
- `master` 대상 PR에서 `npm run validate:all`을 자동 실행하는 `.github/workflows/ci.yml`을 추가했다.
- 이 정리는 런타임 게임 동작·데이터·배포 설정을 변경하지 않는다.

## 2026-09-09 P1 구조 개선 진행

- 퀴즈 세션 상태, 문제팩 로딩, 최근 문항 관리, 오답 5초 대기 타이머, 세션/누적 통계, 퀴즈 통계 localStorage 저장을 `src/hooks/useQuizSession.js`로 분리했다.
- `App.jsx`에는 정답 보상 엽전 지급, 로그, 플로팅 보상 텍스트 등 다른 게임 상태와 직접 연결되는 orchestration만 남겼다.
- 퀴즈 데이터 형식, 보상 계산, 저장 key, 문제 선택 규칙, 화면 마크업은 변경하지 않았다.
- 전체 출시 게이트와 PR CI를 통해 동작 보존 여부를 검증한다.

## 2026-09-09 P1 구조 개선 2차

- 강화 진행 여부, 단계별 연출 상태, 결과 표시, 미리보기 무기, 타격 텍스트·입자·플래시, 마지막 타격 타이밍 입력과 판정을 `src/hooks/useEnhancementSession.js`로 분리했다.
- PERFECT/GOOD/MISS의 판정 구간, 1.8초 왕복 주기, 성공률 보너스, 타이밍 입력 직후 효과와 로그는 기존 값을 그대로 유지했다.
- `App.jsx`에는 강화 비용 차감, 실제 성공률 계산, 무기 단계 변경, 실패 복귀, 대성공 추가 강화 등 게임 규칙 orchestration을 유지했다.
- 따라서 강화 규칙과 확률을 바꾸지 않고 강화 세션의 UI·입력 책임만 분리했다.

## 2026-09-09 P1 구조 개선 3차

- 탐사 run, 속도, 누적 통계, 전리품·준비물 경제 상태를 `src/hooks/useExpeditionSession.js`로 분리했다.
- 탐사 시작, 다음 층 진행, 자동 전투/조우 진행, 안전 귀환, 패배 정산, 정산 ID 중복 방지, settled 체크포인트 복구를 훅으로 이동했다.
- 준비물 제작·장착과 기록 카드 해금도 탐사 도메인 경계에 포함했다.
- 기존 `weaponActiveExpeditionV1`, `weaponExpeditionStatsV1`, `weaponExpeditionEconomyV1` 저장 key와 저장 시점, 패배 시 엽전 보정 및 중복 정산 방지 규칙은 유지했다.
- `App.jsx`에는 현재 무기·엽전·강화 상태와 탐사 훅을 연결하고 모달에 결과를 전달하는 역할만 남겼다.

## 2026-09-09 P1 구조 개선 4차

- 브라우저 저장 실패 감지와 quota/차단 상태 분류를 `src/hooks/useGameStorage.js`로 분리했다.
- 저장 관리자 모달의 열기/닫기 상태와 JSON 저장 파일 export/import 경계를 훅으로 이동했다.
- 진행 중 탐사는 저장 파일 생성 직전에 `useExpeditionSession`의 checkpoint flush를 호출하는 얇은 adapter만 `App.jsx`에 유지해 훅 간 직접 의존성을 만들지 않았다.
- 기존 저장 파일 형식, 1MB 상한, checksum·version 검증, 허용 key 경계, import rollback 및 불러오기 후 reload 동작은 `gameSave.js` 계약을 그대로 사용한다.
- 이 작업으로 초기 P1 구조 개선 목표인 퀴즈·강화·탐사·저장 경계 분리를 완료했다.

## 다음 개발 우선순위

### P0 — 1.2 릴리스 후보 기준선 보존

- 기능 변경 전 `npm run validate:all`을 기본 게이트로 유지한다.
- 현재 serverless 저장 및 JSON 백업 구조를 유지한다.
- 퀴즈 원본 프로젝트를 런타임 의존성으로 다시 연결하지 않는다.
- 과거 토끼·자라 런타임을 현재 앱에 재도입하지 않는다.

### P1 — App.jsx 책임 축소

현재 `App.jsx`가 강화, 퀴즈, 저장, 탐사, 괴작, 도감, 음향, 화면 모드와 애니메이션 상태를 함께 관리한다. 기능을 재설계하지 않고 다음 단위부터 점진적으로 분리하는 것이 다음 구조 개선 후보이다.

- [x] 퀴즈 세션
- [x] 강화 세션 상태·입력
- [x] 탐사 상태·정산
- [x] 저장 실패 및 백업 경계

초기 P1 분리 목표는 완료했다. 추가 분리는 파일 크기 자체를 줄이기 위한 목적이 아니라, 실제 변경 비용이나 결합도가 높은 책임이 확인될 때만 진행한다.

### P2 — 1.2 게임성 개선

P1 구조 개선은 완료되었다. 1.2의 상세 범위와 수치 기준은 [1.2 게임성 개선 계획](./docs/roadmap/v1.2-gameplay-improvement-plan.md)을 기준으로 한다.

현재 1.1 기준 계측에서 +7 무기는 최종층 평균 깊이 7.00까지 도달하지만 무준비 생존 11.6%, 여행 붕대 20.1%, 공명 손질 천 18.3%였다. 따라서 전체 탐사를 일괄 약화하지 않고 최종층 병목과 준비물 효용을 우선 조정한다.

현재 진행은 다음과 같다.

- [x] 1.2-01 조우 다양성 데이터 확장
  - 적 7종, NPC 6종, 사건 6종
  - 모든 지역 NPC 2종 이상·사건 2종 이상
  - 청동 안개 5~6층 일반 적 2종
  - 지역별 지원 조우 이미지·효과 조합 중복 방지 검증
  - 200개 시드 기반 조우 유효성 검증
  - 1.2-01 후 +7 생존: 무준비 13.7%, 여행 붕대 23.8%, 공명 손질 천 22.1%, 안전 주머니 13.6%
  - 런타임 배포물 8.5MB로 10MB 상한 유지
- [x] 1.2-02 일부 NPC/사건 2택 선택
  - 선택형 NPC 2종, 사건 2종
  - `npc-choice` / `event-choice` 상태에서 자동 진행 중지
  - 선택 전 JSON 저장·복구 뒤 동일 선택지 유지
  - 선택 결과 1회 적용 및 잘못된 choice ID 차단
  - 390px 미디어쿼리에서 선택 버튼 1열 배치
  - 1.2-02 후 +7 생존: 무준비 13.5%, 여행 붕대 22.8%, 공명 손질 천 21.0%, 안전 주머니 13.7%
- [x] 1.2-03 +7 최종층 밸런스 조정
  - 최종 적 `primeval-time-shadow`의 HP 배율만 135% → 120%로 조정
  - armor 3, attackPercent 110, powerEvery 2, powerPercent 150은 유지
  - 동일 시드 5,000회 기준 +7 생존: 무준비 24.6%, 여행 붕대 36.9%, 공명 손질 천 34.7%, 안전 주머니 24.6%
  - 단계별 5,000회 기준 +6 생존 3.1%, +7 생존 25.4%, +7 평균 깊이 7.00
  - balance simulator에 +6 ≤5%, +7 무준비 20~30%, 전투 준비물 30~45% 회귀 assertion 추가
- [x] 1.2-04 무기 개성 가시화
  - 무기 7종에 고유 게임 전투 태그 추가: 정밀 사격형·원호 견제형·고위력 치명형·발도 균형형·공명 방호형·정밀 회복형·태고 공명형
  - 기존 attackName/critChance/critMultiplier/guard/healOnHit 수치는 변경하지 않음
  - 치명타 ×배율, 실제 피해 경감, 적중 회복, 지원 공격 보너스를 전투 순간 배지로 표시
  - 치명타 플래시·방어 경감 피격·회복 공격 강조 연출 추가
  - lastAction의 additive 피드백 필드는 기존 run v3 저장과 호환되며 JSON 복구를 자동 검증
  - 1.2-03 밸런스 유지: +6 3.1%, +7 25.4%, 무준비 24.6%, 붕대 36.9%, 손질 천 34.7%
- [x] 1.2-05 실제 강화 경제 시뮬레이션
  - 런타임과 시뮬레이터가 대성공·복원 상한·타이밍 판정 폭 공용 규칙을 공유
  - 실제 규칙 20,000회 기준 복원 없음: MISS 133.9회/14,091냥/기준팩 167.8문제, 타이밍 창 비례 113.7회/12,420냥/147.9문제, GOOD 이상 혼합 89.4회/10,303냥/122.7문제, PERFECT 71.3회/8,621냥/102.6문제
  - 최고 가능 단계 즉시 복원은 타이밍 창 비례에서 41.6회/25,666냥/305.6문제로 시도를 63.4% 줄이는 대신 비용을 106.6% 늘림
  - GOOD 이상 혼합·복원 없음 기준: 기초 보상팩 153~172문제, 중간 114~133문제, 고난도 92~96문제
  - 괴작 판매·칭호 보상은 확률/선택 보너스이므로 보수적으로 제외
  - 핵심 경제가 허용 범위 안이라 강화 비용·성공률·타이밍 보너스·퀴즈 보상·복원 가격은 변경하지 않음
- [ ] 1.2-06 최종 회귀 검증 및 릴리스
  - package/package-lock `1.2.0` 버전 정합성 준비
  - README 현재 콘텐츠 수와 1.2 기능 설명 갱신
  - `docs/releases/v1.2.0.md` 릴리스 후보 노트 추가
  - `validate:release`를 `validate:all`에 포함
  - 자동 검증이 모두 성공해도 실제 브라우저/OS 수동 게이트 3건 전에는 태그·GitHub Release를 만들지 않음

정식 발행 안전장치도 준비했다.

- `npm run validate:publish`: 수동 3건 완료와 RC→Stable 문서 전환이 모두 끝나야 통과
- `.github/workflows/release.yml`: `master` 수동 실행 전용, 버전·최신 HEAD·수동 확인·기존 태그를 검사
- `validate:release` publish 자가검증: RC에서는 `validate:publish` 차단, Stable에서는 성공을 매 CI에서 실제 subprocess 실행으로 확인
- `docs/releases/PUBLISHING.md`: 최종화 PR과 Release 발행 순서 기록
- 현재 RC에서는 `validate:publish`가 실패하는 것이 의도된 상태이며 태그/Release를 만들지 않음

다음 단계는 **수동 릴리스 게이트 3건 완료 → 최종화 PR → Pages 성공 확인 → Publish GitHub Release 워크플로 실행**이다.

기존 후보 목록은 아래와 같다.

1. 탐사 조우·전투의 반복감 점검 및 적/NPC/사건 다양화
2. 무기별 전투 개성 및 시각 피드백 강화
3. 역사 기록 카드와 학습 정보 확장
4. 탐사 준비물 선택지 확대
5. 강화·탐사 밸런스 재시뮬레이션

구조 변경은 위 기능 작업에 필요한 범위에서만 추가한다.

기존 확장 후보는 다음과 같다.

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
