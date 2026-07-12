# Weapon Reinforce AGENTS

## Project State
- active

## Scope
- React/Vite browser game for Korean weapon reinforcement, quiz rewards, gallery collection, daily news settlement, and continuous time-rift expeditions.
- Keep work inside this project folder unless the user explicitly asks for workspace-level changes.

## Source of Truth
- App code: `src/App.jsx`, `src/index.css`
- Gameplay data: `src/data/weaponTimeline.js`, `src/data/quizCatalog.js`, `src/data/expeditionCatalog.js`, `src/data/expedition.js`, `src/data/expeditionEconomy.js`
- Expedition, shop, save, and history UI: `src/components/ExpeditionModal.jsx`, `src/components/ExpeditionWorkshopModal.jsx`, `src/components/SaveManagerModal.jsx`, `src/components/HistoryArchiveModal.jsx`
- Save parsing boundaries: `src/data/safeStorage.js`, `src/data/gameSave.js`
- Expedition 1.0 rules and implementation order: `docs/expedition-1.0-implementation-plan.md`
- Expedition 1.1 system rules: `docs/expedition-1.1-system-plan.md`
- Static source assets: `public/images/`, `public/quiz/`, `public/favicon.svg`
- Deployable asset allowlist: `scripts/prepare-runtime-public.mjs` → generated `.runtime-public/`
- Quiz snapshot provenance and refresh rules: `docs/quiz-source-boundary.md`, `public/quiz/weapon-reinforce-manifest.json`
- Status and checks: `PROJECT_STATUS.md`, `CHECKLIST.md`
- Longer notes: `docs/`
- Image generation baseline: `docs/image-regeneration-brief.md`
- Yi Sun-sin combo animation baseline: `docs/yisun-combo-animation-standards.md`
- Yi Sun-sin action reference study: `docs/yisun-action-reference-study.md`
- External sprite style references:
  - `/Users/baekjiyun/Desktop/WAN/apps/pinky-ne-site/games/knol-jump/assets/characters/sejong/sejiong_front.png`
  - `/Users/baekjiyun/Desktop/WAN/apps/pinky-ne-site/games/knol-jump/assets/characters/leesunsin/leesunsin_front.png`
  - `/Users/baekjiyun/Desktop/WAN/apps/pinky-ne-site/games/knol-jump/assets/characters/hernanseolheon/heonanseolheon_front.png`

## Run and Test Commands
- Install: `npm ci`
- Dev server: `npm run dev -- --host 127.0.0.1 --port 5173`
- Build: `npm run build`
- Lint: `npm run lint`
- Weapon timeline validation: `npm run validate:weapons`
- Quiz catalog validation: `npm run validate:quizzes`
- Save corruption recovery validation: `npm run validate:saves`
- Save-file envelope/import validation: `npm run validate:save-file`
- Expedition state-machine validation: `npm run validate:expedition`
- Expedition loot/shop economy validation: `npm run validate:economy`
- Reinforcement/expedition balance simulation: `npm run validate:balance`
- Built runtime allowlist/size validation: `npm run validate:runtime` (run after `npm run build`)
- Full release gate: `npm run validate:all`

## Change Safety Rules
- Preserve the single-app Vite/React structure.
- Do not add new frameworks, package managers, external services, or asset pipelines without an explicit request.
- Keep progress serverless: browser `localStorage` is the automatic checkpoint and the versioned JSON file is the portable backup/restore path.
- Keep gameplay changes small and verify with `npm run build`; use `npm run lint` when touching code.
- Validate visible UI changes with browser or Playwright checks on desktop and mobile-sized viewports when practical.
- Update `PROJECT_STATUS.md` and `CHECKLIST.md` after meaningful behavior or UI changes.
- Keep quiz earning data as a reviewed snapshot. Do not fetch another app's files at runtime.
- Do not reintroduce the retired rabbit/turtle visual-novel runtime. Its historical source assets remain outside the deployable allowlist until a separate migration task removes or moves them.
- For new enemy, bond, event, or character images, use Korean historical/cultural sources for subject matter and the listed `knol-jump` Sejong/Yi Sun-sin/Heo Nanseolheon sprites for pixel style, proportions, and visual density.
- Treat new stories, sprites, balance changes, and quiz snapshots as review candidates until their project data or status file records approval. Do not infer approval from a generated asset or planning document.
- Keep `archive/`, `tmp/`, candidate boards, source references, and rejected variants outside the deployable runtime allowlist.

## Git And Release
- Canonical repository: `LUCKYBRIDGE/weapon-reinforce`, default branch in this checkout `master`.
- Package version `1.1.0` is the serverless expedition economy/combat baseline. Future work should preserve its desktop, tablet, mobile, reload-resume, save-envelope, and production-preview release checks.
- This checkout contains substantial ongoing work; preserve unrelated changes and use a clean worktree for scoped publish requests when necessary.
- Before release, run `npm run validate:all`, inspect the runtime allowlist/size report and scoped diff, then smoke-test the changed gameplay/save flow in a browser.
- Commit, push, GitHub Pages deployment, and any asset publication are separate explicit actions.

## Migration Note
- This project was imported from `LUCKYBRIDGE/weapon-reinforce` into the WAN `apps/` workspace on 2026-06-04.
- The original lowercase `agents.md` was renamed to `AGENTS.md` and replaced with this project-specific harness contract.
