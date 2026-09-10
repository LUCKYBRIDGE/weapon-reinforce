# Release Publishing

이 문서는 수동 브라우저 검증을 건너뛰지 않고 정식 GitHub Release를 발행하는 절차를 정리한다.

## 현재 1.2.0 순서

1. `CHECKLIST.md`에 남은 수동 릴리스 게이트를 실제 브라우저/OS에서 확인한다.
2. 별도 최종화 PR에서 다음을 함께 바꾼다.
   - 수동 게이트 3건을 `[x]`로 완료 처리
   - `docs/releases/v1.2.0.md` 상태를 `정식 릴리스(Stable)`로 변경
   - 릴리스 노트의 수동 게이트 체크박스를 모두 완료 처리
   - `README.md`의 `현재 릴리스 후보`를 `현재 출시 버전`으로 변경
   - `PROJECT_STATUS.md`의 현재 버전을 릴리스 후보가 아닌 출시 버전으로 변경
   - `AGENTS.md`의 package baseline을 `current release baseline`으로 변경
3. 최종화 PR에서 `npm run validate:all`을 통과시킨 뒤 `master`에 병합한다.
4. 병합으로 실행된 GitHub Pages 배포가 성공했는지 확인한다.
5. GitHub Actions의 `Publish GitHub Release` 워크플로를 `master`에서 수동 실행한다.
   - version: `1.2.0`
   - manual_gates_confirmed: true
6. 워크플로가 다시 `npm run validate:all`과 `npm run validate:publish`를 실행한다.
7. 두 검증이 모두 성공하고 같은 태그/Release가 없을 때만 `v1.2.0` 태그와 GitHub Release를 생성한다.

## Publish gate가 차단하는 경우

`npm run validate:publish`는 다음 상황에서 실패해야 정상이다.

- CHECKLIST에 미완료 `[ ]` 항목이 하나라도 남아 있음
- 수동 게이트 3건 중 하나라도 완료 표시가 없음
- 릴리스 노트 상태가 아직 Release Candidate임
- 릴리스 노트에 미완료 체크박스가 남아 있음
- README에 `현재 릴리스 후보` 문구가 남아 있음
- PROJECT_STATUS에 `현재 릴리스 후보` 문구가 남아 있음
- AGENTS의 package baseline이 아직 release-candidate baseline임

따라서 현재 RC 단계에서 `npm run validate:publish`가 실패하는 것은 의도된 동작이다.

## Workflow safety

`.github/workflows/release.yml`은 다음 조건도 확인한다.

- workflow dispatch가 `master` ref에서 실행됨
- 입력한 version과 `package.json` version이 일치함
- 사용자가 manual gate 완료 확인 값을 true로 지정함
- checkout HEAD가 최신 `origin/master`와 일치함
- 동일한 `v<version>` 태그가 아직 없음
- 동일한 GitHub Release가 아직 없음

태그와 Release 생성은 모든 검증이 끝난 마지막 단계에서만 실행한다.
