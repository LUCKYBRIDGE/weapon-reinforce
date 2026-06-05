# Weapon Reinforce AGENTS

## Project State
- active

## Scope
- React/Vite browser game for Korean weapon reinforcement, quiz rewards, gallery collection, daily news settlement, and Joseon Paldo sortie battles.
- Keep work inside this project folder unless the user explicitly asks for workspace-level changes.

## Source of Truth
- App code: `src/App.jsx`, `src/index.css`
- Static assets: `public/images/`, `public/icons.svg`, `public/favicon.svg`
- Status and checks: `PROJECT_STATUS.md`, `CHECKLIST.md`
- Longer notes: `docs/`
- Image generation baseline: `docs/image-regeneration-brief.md`
- Yi Sun-sin combo animation baseline: `docs/yisun-combo-animation-standards.md`
- External sprite style references:
  - `/Users/baekjiyun/Desktop/WAN/apps/pinky-ne-site/games/knol-jump/assets/characters/sejong/sejiong_front.png`
  - `/Users/baekjiyun/Desktop/WAN/apps/pinky-ne-site/games/knol-jump/assets/characters/leesunsin/leesunsin_front.png`
  - `/Users/baekjiyun/Desktop/WAN/apps/pinky-ne-site/games/knol-jump/assets/characters/hernanseolheon/heonanseolheon_front.png`

## Run and Test Commands
- Install: `npm ci`
- Dev server: `npm run dev -- --host 127.0.0.1 --port 5173`
- Build: `npm run build`
- Lint: `npm run lint`

## Change Safety Rules
- Preserve the single-app Vite/React structure.
- Do not add new frameworks, package managers, external services, or asset pipelines without an explicit request.
- Keep gameplay changes small and verify with `npm run build`; use `npm run lint` when touching code.
- Validate visible UI changes with browser or Playwright checks on desktop and mobile-sized viewports when practical.
- Update `PROJECT_STATUS.md` and `CHECKLIST.md` after meaningful behavior or UI changes.
- For new enemy, bond, event, or character images, use Korean historical/cultural sources for subject matter and the listed `knol-jump` Sejong/Yi Sun-sin/Heo Nanseolheon sprites for pixel style, proportions, and visual density.

## Migration Note
- This project was imported from `LUCKYBRIDGE/weapon-reinforce` into the WAN `apps/` workspace on 2026-06-04.
- The original lowercase `agents.md` was renamed to `AGENTS.md` and replaced with this project-specific harness contract.
