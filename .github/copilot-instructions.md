<!--
Guidance for AI coding agents working on this repository.
Keep this file short, specific, and actionable. Refer to files and patterns that an agent can inspect.
-->

# Copilot instructions — oicredit

Summary
- This is a Vite + React (TypeScript) frontend app that simulates a banking platform. There is no backend API in the repo; most data is seeded from `constants.ts` and managed in-memory (see `App.tsx`). The app uses Google GenAI via `@google/genai` and expects a `GEMINI_API_KEY` in `.env.local`.

Key files and patterns
- `package.json` — scripts: `npm run dev` (vite), `npm run build`, `npm run preview`. Use these for running and building locally.
- `vite.config.ts` — exposes `GEMINI_API_KEY` via `define` and sets the dev server to port 3000/host 0.0.0.0. When adding environment config, follow this pattern.
- `tsconfig.json` — path alias `@` → project root. Imports using `@/path` should resolve to the repository root.
- `App.tsx` — the single top-level orchestrator. It holds most application state (users, accounts, transactions, notifications) and wires together UI components and services. When changing app flows, update handlers here and ensure downstream components receive required props.
- `components/` — UI is split into many named components (PascalCase filenames). Components are usually imported as named exports, e.g. `import { Header } from './components/Header'`.
- `services/` — side-effect logic lives here (e.g., `notificationService`, `exchangeRateService`). Prefer adding business logic to `services/*` rather than embedding network/email logic inside components.
- `constants.ts` — contains large sets of initial data (INITIAL_TRANSACTIONS, INITIAL_RECIPIENTS, etc.). Use these when creating mock data or fixtures.

What to know about architecture and data flow
- There is no server API in this repo. The app seeds demo data from `constants.ts` and calls into `services/*` for simulated external actions (emails, SMS). If you add a real backend integration, keep the services layer as the boundary (create `services/apiClient.ts` and use it from `App.tsx` and `services/*`).
- `App.tsx` acts as the state owner. Many components are presentational and receive callbacks/props. To add a new flow:
  - Add UI under `components/` as a named exported React component.
  - Add a handler in `services/` for side-effects if required.
  - Wire the component into `App.tsx` and pass props/handlers.

Environment & secrets
- The app expects a `GEMINI_API_KEY` (Gemini / Google GenAI) referenced in `vite.config.ts` and the README. Add it to `.env.local` as `GEMINI_API_KEY` when running locally. Vite's `define` in `vite.config.ts` exposes it as `process.env.GEMINI_API_KEY`.

Build / dev workflow (practical)
1. Install deps: `npm install`
2. Add `.env.local` with `GEMINI_API_KEY=<your-key>`
3. Dev: `npm run dev` (opens on port 3000). Preview a production build: `npm run build && npm run preview`.

Project-specific conventions
- Named exports for components (check `components/Header.tsx`, `components/Dashboard.tsx`). Prefer `export function X()` or `export const X = () => {}` rather than default exports to match existing code.
- Keep side-effects in `services/`. Examples: `services/notificationService.ts` exposes `sendTransactionalEmail(...)` and helpers like `generateTransactionReceiptEmail(...)` used by `App.tsx`.
- Seed/mock data lives in `constants.ts` and is imported directly; avoid duplicating mock seeds — reuse those constants for tests or story fixtures.
- Route/view selection in the app is controlled by an internal view state (`activeView`) in `App.tsx`. For changes to navigation, update that state and ensure menu interactions close the menu (`setIsMenuOpen(false)` pattern is common).

Examples from the codebase (copyable patterns)
- Import a service and call it from `App.tsx`:
  - `import { sendTransactionalEmail } from './services/notificationService';`
  - `sendTransactionalEmail(userProfile.email, subject, body);`
- Use path alias import (root alias `@`):
  - `import { SOME_CONST } from '@/constants';`

When opening a PR
- Keep changes scoped and prefer adding logic to `services/` instead of enlarging `App.tsx` further.
- If you introduce new environment variables, add them to `vite.config.ts` using the same `define` pattern and document them in the README.

Missing or surprising things
- There are no test scripts in `package.json` and no backend. If adding tests, prefer lightweight unit tests for services and component tests with a renderer (Jest/React Testing Library) and add scripts to `package.json`.

If something in these instructions is unclear or you'd like more detail (examples for adding a service, wiring a new flow into `App.tsx`, or a suggested test scaffold), tell me which part to expand and I will iterate.
