# Weapon Reinforce

퀴즈로 엽전을 모아 한국 무기를 강화하고, 시간 균열을 탐사하며 무기와 시대를 알아보는 React/Vite 웹 게임이다. 토끼·자라 이야기는 이 프로젝트의 현재 런타임과 배포 자산에서 분리되어 있다.

공개 게임: [https://luckybridge.github.io/weapon-reinforce/](https://luckybridge.github.io/weapon-reinforce/)

현재 릴리스 후보: `1.2.0`

## 현재 플레이 구조

- `K2 소총 → 월도 → 장도·쌍수도 → 환도 → 칠지도 → 한국식 동검 → 비파형동검`의 단일 시간역행 강화 트리
- 터치·마우스·키보드로 멈추는 강화 타이밍 바와 단계별 성공 확률
- 9종, 762문항의 수학·공간 감각 퀴즈로 얻는 엽전
- 7개 역사층으로 이어지는 시간 균열 탐사
- 깊이와 지역에 맞춰 가중 추첨되는 적 7종, NPC 6종, 사건 6종
- 일부 NPC/사건에서 두 결과 중 하나를 고르는 선택형 지원 조우
- 적 역할·공격 예고·강공 패턴을 포함한 플레이어/적 교대 자동전투
- 무기별 고유 공격명·치명타·방어·회복을 드러내는 게임 전투 효과와 전투 순간 피드백
- NPC/사건의 회복·다음 공격·방어·전리품 조사 효과
- 안전 귀환 전까지 임시 보관되는 가상 전리품 6종과 사망 손실
- 전리품과 퀴즈 엽전으로 준비물을 만들고 장착하는 `탐사 준비소`
- 실패 괴작의 마지막 보유품 판매 경고와 중복 일괄 판매
- 탐사 중 본 무기·시대 정보를 기록 조각으로 복원하는 `시간 기록관`

## 저장 방식

별도 서버나 계정은 사용하지 않는다.

- 기본 저장은 브라우저 `localStorage` 자동 저장이다. 플레이 진행도와 진행 중인 탐사가 별도 조작 없이 계속 저장된다.
- 탐사 도중 새로고침하거나 창을 닫아도 같은 브라우저에서 이어서 시작한다.
- 더 확실한 보관이나 기기 이동이 필요할 때만 대장간의 `저장·백업` 또는 탐사 중 `파일 백업`으로 저장 데이터 파일을 내려받는다.
- `저장·백업`에서 파일을 다시 불러오면 탐사 체크포인트까지 다른 기기에서 이어진다.
- 저장 데이터 파일은 JSON 형식이며, 불러올 때 형식·버전·크기·체크섬을 확인한 뒤 게임 관리 항목을 교체한다.

브라우저 데이터 삭제, 시크릿 모드 종료, 기기 변경에는 로컬 저장이 유지되지 않을 수 있다. 중요한 진행도는 JSON 파일로 주기적으로 백업해야 한다.

## 실행

Node.js 22 기준이다.

```bash
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

운영용 빌드와 미리보기:

```bash
npm run build
npm run preview -- --host 127.0.0.1
```

## 검증

```bash
npm run validate:all
```

전체 게이트는 무기·퀴즈·손상 저장 복구·저장 파일·탐사 경제·조우/전투 상태·밸런스·릴리스 버전/문서 정합성·ESLint·프로덕션 빌드·런타임 자산을 검사한다. 세부 명령과 수동 검증 순서는 [CHECKLIST.md](./CHECKLIST.md), 현재 구현 상태는 [PROJECT_STATUS.md](./PROJECT_STATUS.md)에 기록한다.

사용한 오픈소스 소프트웨어의 저작권과 라이선스는 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)에 기록한다.

## 주요 파일

- `src/data/weaponTimeline.js`: 7단계 무기·역사·전투 개성
- `src/data/expeditionCatalog.js`: 지역·적·NPC·사건·역사층
- `src/data/expedition.js`: 탐사 상태 머신과 정산
- `src/data/expeditionEconomy.js`: 가상 전리품·준비물·교환·중복 방지 정산
- `src/components/ExpeditionWorkshopModal.jsx`: 준비물·전리품 창고·복원 무기고 통합 화면
- `src/data/gameSave.js`: JSON 저장 파일 경계
- `docs/expedition-1.0-implementation-plan.md`: 1.0 구현 규칙과 범위
- `docs/expedition-1.1-system-plan.md`: 조우·전투·전리품·준비소 1.1 규칙
