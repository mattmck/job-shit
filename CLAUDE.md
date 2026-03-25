# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev -- <command>   # run CLI without building (uses tsx)
npm run serve              # start API server (tsx, no build needed)
npm run web                # start Vite dev server for web frontend
npm run build              # compile backend to dist/ + build frontend to web/dist/
npm run web:build          # build frontend only
npm test                   # run tests (vitest)
npm run typecheck          # tsc --noEmit
npm run lint               # eslint
```

Run a single test file: `npx vitest run tests/files.test.ts`

## Architecture

Monorepo with two package roots:
- **Root** (`package.json`) — Node.js/TypeScript CLI + API server, built with Commander
- **`web/`** (`web/package.json`) — React frontend (Vite + Tailwind CSS 4 + Radix UI)

### CLI commands (`src/commands/`)

- **`tailor`** — one-off tailoring from a local JD file: `tailored tailor --company "Acme" --job jd.txt`
- **`huntr`** — Huntr.co integration subcommands (wishlist, jobs, tailor, tailor-all)
- **`serve`** — starts the API server + serves the built web frontend

### Core lib (`src/lib/`)

- `ai.ts` — thin Anthropic/Claude wrapper (`complete()`, takes an injected client)
- `tailor.ts` — `tailorDocuments()` fans out resume + cover letter calls via `Promise.all`
- `prompts.ts` — system/user prompts for resume and cover letter, kept separate
- `files.ts` — `findFile()` auto-discovers `resume*.md` / `bio*.md` from CWD then `~/.well-tailored/`
- `render.ts` — markdown → HTML rendering, PDF export via Chrome headless
- `diff.ts` — markdown diffing
- `providers.ts` — multi-provider normalization (Gemini, Azure, OpenAI, Anthropic)

### API server (`src/server.ts`)

Pure Node.js HTTP server (no framework) on port 4312. Serves the built React frontend at `/` and exposes REST endpoints under `/api/`:

- `/api/runs/manual`, `/api/runs/huntr` — tailoring generation
- `/api/gap`, `/api/score`, `/api/diff` — analysis endpoints
- `/api/regenerate-section` — AI-powered single-section rewrite
- `/api/render`, `/api/export/pdf` — rendering and PDF export
- `/api/huntr/jobs`, `/api/huntr/wishlist` — Huntr job listing
- `/api/config`, `/api/workspace/local` — config and document auto-discovery
- `/api/workspaces/*` — workspace save/load/delete

### Web frontend (`web/`)

React 19 + Vite + Tailwind CSS 4 + Radix UI. Feature-sliced layout:

- `web/src/App.tsx` — root: `useReducer` state, context provider, resizable panel layout
- `web/src/state.ts` — centralized reducer + actions
- `web/src/api/client.ts` — typed fetch wrapper for all API endpoints
- `web/src/features/` — feature modules:
  - `jobs/` — Huntr job list, stage filtering, paste-JD modal, batch tailor confirmation
  - `editor/` — markdown editor with section-level AI regeneration, missing keywords
  - `preview/` — HTML preview with diff view
  - `scores/` — heuristic + evaluator score cards with detail modal
  - `workspace/` — top bar (provider/model selection, workspace management), tailoring status
  - `sources/` — source document panel (resume, bio, supplemental)
  - `prompts/` — system prompt customization
  - `config/` — provider/model config panel
  - `layout/` — icon rail, panel container

In dev mode, Vite runs on :5173 and proxies `/api` to :4312. In production, the backend serves `web/dist/` directly.

### Interactive Review TUI (`src/tui/`)

- `review.tsx` — React/Ink split-panel terminal UI for reviewing AI-generated resumes
- Keyboard: `↑/↓` navigate, `Enter` expand, `d` diff, `a` accept, `e` open `$EDITOR`, `r` regenerate section via AI, `q` finish
- Launched via `--interactive` flag on `tailor`, `huntr tailor`, `huntr tailor-all`; or via `review <jobId>` command for saved workspaces

### Services (`src/services/`)

- `runs.ts` — `runTailorWorkflow()` orchestrates generation + rendering + scoring
- `huntr.ts` — Huntr API client, job listing, input building
- `review.ts` — `regenerateResumeSection()` sends section + full resume context to AI for single-section rewrite
- `gap.ts` — `analyzeGap()` keyword matching against JD (matched, missing, partial matches, overall fit rating)
- `scoring.ts` — heuristic + AI evaluator scoring
- `workspace-store.ts` — persists workspace snapshots to `~/.well-tailored/workspaces/`
- `workspace.ts` — resolves workspace documents from local files

### Config

`src/config.ts` — multi-provider config with named profiles. Loads API keys from env vars, supports per-task provider/model defaults. `resolveHuntrToken()` checks env → `~/.huntr/config.json` → system keychain (keytar).

### Output

All generated files go under `output/` (gitignored). Naming: `resume-<company>-<title>-<jobId>.md` / `cover-letter-<company>-<title>-<jobId>.md`.

## Conventions

- TypeScript ESM (`"type": "module"`). Use `.js` extensions in imports (backend only; web/ uses Vite resolution).
- Tests in `tests/` with Vitest. Anthropic client is injected so tests never hit the network.
- Web frontend uses `@/` path alias mapped to `web/src/`.
- Run `npm run typecheck` and `npm test` before committing.
