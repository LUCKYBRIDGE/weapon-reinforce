# Apps AGENTS

These instructions apply to app and code projects under `C:\ai_dev\apps`.

## Scope

`apps/` contains standalone app projects inside the approved `C:\ai_dev` workspace. Current projects include static HTML apps, JSON-backed educational apps, Google Apps Script apps, Vite/React apps, and mixed app/document projects.

## Current Projects

- `blooket-image-generator`: static Vanilla HTML/JS/CSS app for Blooket math image generation.
- `fake-news`: static Korean news-literacy app backed by article JSON files.
- `math-net-master`: React/Vite/TypeScript geometry net app using Three.js.
- `school-scheduler`: Google Apps Script web app with `.gs` server files and `.html` partials.
- `survival-conversation`: mixed static app and proposal/document-generation project.

## Working Rules

- Follow `C:\ai_dev\AGENTS.md` first, then this file, then the specific app's `AGENTS.md` when present.
- Treat each immediate child folder of `apps/` as a separate project boundary.
- Create new app projects under `apps/<project-name>/` unless the user explicitly names a different location.
- Before changing an app, read that app's `PROJECT_STATUS.md`, `CHECKLIST.md`, and `AGENTS.md`.
- After a meaningful change, update the app's `PROJECT_STATUS.md` and mark or add relevant checks in `CHECKLIST.md`.
- Do not move files between app folders unless the user explicitly asks.
- Preserve the imported app's existing architecture and naming unless cleanup is part of the request.
- Do not add package managers, build steps, frameworks, or external services to static apps unless the user explicitly asks.
- Treat uploaded classroom data, quiz data, proposal content, and generated outputs as potentially sensitive.
- Do not hardcode API keys, private URLs, personal credentials, or deployment secrets.

## Validation Defaults

- For static HTML apps, prefer `python -m http.server <port>` from the app folder and test the relevant page in a browser.
- For Vite/React apps, use the package scripts already declared in `package.json`, usually `npm run build` and `npm run dev`.
- For Google Apps Script apps, validate includes, function names, and RPC wiring locally; full validation usually requires Apps Script deployment.
- If the app depends on CDN libraries or remote images, note that browser validation also depends on network access.
- For JSON-backed apps, validate that referenced JSON files and asset paths exist.
- For document-generation scripts, validate with a sample input only when it does not expose sensitive data.
- If full browser or document validation is not practical, report the file-level checks performed and the remaining risk.

## Documentation

- Durable app-specific rules belong in `apps/<app-name>/AGENTS.md`.
- Development status belongs in `apps/<app-name>/PROJECT_STATUS.md`.
- Repeatable validation and release checks belong in `apps/<app-name>/CHECKLIST.md`.
- Longer investigation notes and decisions belong in `C:\ai_dev\docs\logs\YYYY-MM-DD-<topic>.md`.
