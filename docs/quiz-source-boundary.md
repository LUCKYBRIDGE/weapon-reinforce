# 퀴즈 스냅샷 경계

## 목적

Weapon Reinforce의 엽전 수입은 `pinky-ne-site` 위인점프맵에서 사용하던 여러 유형의 문제를 푸는 방식이다. 두 앱을 실행 중에 결합하지 않고, 검증된 문제 묶음만 이 프로젝트 안에 스냅샷으로 보관한다.

## 현재 스냅샷

- 원본: `apps/pinky-ne-site/games/knol-jump/assets/quiz`
- 대상: `public/quiz`
- 출처 기록: `public/quiz/weapon-reinforce-manifest.json`
- 규모: 9팩, 762문항, SVG 506개
- 유형: 구구단, 나눗셈, 10 만들기, 100 만들기, 10/100/1000 곱하기, 책상/의자, 면 색칠, 모서리 색칠, 전개도 판별

이 스냅샷은 프로젝트 소유자의 요청에 따라 같은 작업공간 안에서 재사용한 것이다. 원본에 명시적인 공개 라이선스가 없으므로 외부 라이선스를 임의로 주장하거나 다른 프로젝트에 다시 배포하지 않는다.

## 런타임 원칙

- 다른 앱의 경로나 서버를 런타임에서 읽지 않는다.
- `src/data/quizCatalog.js`만 팩 이름, 보상 범위, 파일 형식을 정의한다.
- `scripts/prepare-runtime-public.mjs`가 배포 전에 스냅샷을 허용 자산으로 복사한다.
- 문제 선택은 최근 문항 반복을 피하되 정답과 보상은 클라이언트에서 한 번만 처리한다.

## 갱신 절차

1. 원본 문제의 문항 수, 정답 포함 여부, SVG 참조를 먼저 확인한다.
2. `public/quiz`를 새 스냅샷으로 교체한다.
3. 매니페스트의 `sourceCommit`, `copiedAt`, 문항/팩 수를 갱신한다.
4. 필요한 경우 `QUIZ_PACKS`의 문항 수와 보상 범위를 조정한다.
5. `npm run validate:quizzes`와 `npm run validate:all`을 통과시킨다.
6. 텍스트형 한 팩과 SVG 선택형 한 팩을 모바일/데스크톱에서 직접 푼다.
