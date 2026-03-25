# Well-Tailored

Job applications that actually fit. Turn your experience and a job description into sharper, more tailored application materials without losing your voice.

## How it works

See [`docs/generation-flow.html`](docs/generation-flow.html) for a full architecture diagram (also in [landscape](docs/generation-flow-landscape.html)).

Three entry points, one pipeline:

```
  [CLI]        resume.md + bio.md + job.txt + --company
  [Huntr CLI]  Wishlist jobs pulled automatically via Huntr API
  [Workbench]  Browser UI at http://localhost:4312
       │
       ▼
  Provider (auto mode falls back by env priority)
  Gemini → Azure OpenAI → OpenAI-compatible → Anthropic
       │
       ▼
  Generate (Promise.all — concurrent)
  ┌─────────────────┬──────────────────┐
  │  resume         │  cover letter    │
  │  systemPrompt() │  systemPrompt()  │
  │  userPrompt()   │  userPrompt()    │
  └─────────────────┴──────────────────┘
       │
       ▼
  Render: markdown → marked → sanitize-html → HTML → Chrome headless → PDF
       │
       ▼
  output/resume-<slug>.{md,html,pdf}
  output/cover-letter-<slug>.{md,html,pdf}
```

Stack resume maintenance runs as a separate track using `tailorResume()` — single AI call, no cover letter.

## Setup

```bash
cp .env.example .env
# Add at least one AI provider key (see Environment variables below)
npm install
cd web && npm install && cd ..
npm run build
```

## Usage

### Tailor resume + cover letter for a job

```bash
# Minimal — resume and bio are auto-detected from CWD or ~/.well-tailored/
tailored tailor --company "Acme Corp" --job jd.txt

# Full options
tailored tailor \
  --company "Acme Corp" \
  --job jd.txt \
  --title "Senior Software Engineer" \
  --resume path/to/resume.md \
  --bio path/to/bio.md \
  --supplemental path/to/resume-supplemental.md \
  --output output/
```

Outputs (written to `output/`, gitignored):
- `resume-<slug>.md` / `.html` / `.pdf`
- `cover-letter-<slug>.md` / `.html` / `.pdf`

`<slug>` is a date-prefixed, URL-safe identifier derived from the job (for example, including the date plus normalized title and job ID parts).
PDF generation requires Google Chrome installed.

### Base files

| File | Purpose | Auto-discovery |
|------|---------|----------------|
| `resume*.md` | Base resume (markdown) | CWD, then `~/.well-tailored/` — most recently modified wins |
| `bio*.md` | Personal background blurb | CWD, then `~/.well-tailored/` |
| `cover-letter*.md` | Voice/tone reference for cover letter | CWD, then `~/.well-tailored/` — optional |
| `resume-supplemental*.md` | Extra factual context for AI | CWD, then `~/.well-tailored/` — optional |

### Interactive Review TUI

Add `--interactive` to any tailor command to launch a split-panel terminal UI (React/Ink) for reviewing and refining the AI-generated resume before it's written to disk.

```bash
# One-off tailor with interactive review
tailored tailor --company "Acme Corp" --job jd.txt --interactive

# Huntr single job
tailored huntr tailor <jobId> --interactive

# Huntr batch — review each job in turn
tailored huntr tailor-all --interactive

# Re-review a previously saved result
tailored review <jobId> --workspace <id> --v <index>
```

The TUI shows a scrollable section list on the left and a detail panel on the right with live JD keyword coverage, diff visualization, and section content.

**Keyboard controls:**

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate between resume sections |
| `Enter` | Expand / collapse section content |
| `d` | Toggle diff view (changes vs. base resume) |
| `a` | Accept / unaccept the current section |
| `e` | Open section in `$EDITOR` for manual editing |
| `r` | Regenerate the section via AI (uses full resume + JD context) |
| `q` | Finish review and write final output |

The detail panel shows matched JD keywords and partial matches per section so you can see coverage gaps at a glance. Gap analysis recomputes live after every edit or regeneration.

### Huntr.co integration

```bash
# List jobs in your Wishlist (not yet applied to)
tailored huntr wishlist

# List all jobs across boards with their current stage
tailored huntr jobs

# Tailor a specific job (board auto-detected)
tailored huntr tailor <jobId>

# Tailor every Wishlist job in one shot
tailored huntr tailor-all
```

**Credentials** are resolved automatically in this order:
1. `HUNTR_API_TOKEN` environment variable
2. `~/.huntr/config.json` (written by `huntr config set-token`)
3. System keychain (written by `huntr config set-token --keychain`)

If you've already used huntr-cli, no extra config is needed.

### Workbench (browser UI)

```bash
# Start the API server + serve the built frontend
tailored serve          # or: npm run serve

# Development mode — Vite dev server with hot reload, proxying API to :4312
npm run serve &         # API server in background
npm run web             # Vite dev server on http://localhost:5173
```

The workbench is a React + Vite + Tailwind CSS app in `web/`. In production the backend
serves the built frontend from `web/dist/`; in development `npm run web` starts the Vite
dev server on port 5173 and proxies `/api` requests to the backend on port 4312.

**Layout:** top bar (workspace management, provider/model selection) → icon rail (panel switcher) → resizable three-column layout (jobs/sources/config panel | editor | preview) with score cards.

**Features:**
- Huntr job list with stage filtering, or paste a JD manually
- Batch tailoring with queued execution
- Live markdown editor with section-level AI regeneration
- Side-by-side preview with HTML rendering and diff view
- Heuristic + AI scoring with detailed breakdown
- Missing keyword analysis against the JD
- PDF / HTML / Markdown export
- Workspace save / load for resuming later
- Customizable system prompts and resume themes

## Environment variables

At least one AI provider key is required. In `auto` mode, the first matching configured provider wins.
The workbench can explicitly switch between configured providers, so you can keep several backends
available locally at once.

| Variable | Provider | Default model |
|----------|----------|---------------|
| `GEMINI_API_KEY` | Google Gemini | `gemini-2.0-flash-lite` |
| `AZURE_OPENAI_ENDPOINT` + `AZURE_OPENAI_API_KEY` | Azure AI Foundry | `gpt-4o-mini` |
| `OPENAI_API_KEY` | OpenAI (or any compatible endpoint) | `gpt-4o-mini` |
| `ANTHROPIC_API_KEY` | Anthropic Claude | `claude-haiku-4-5` |

Optional:

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_MODEL` / `OPENAI_MODEL` | Override the default model for that provider |
| `GEMINI_MODEL` | Override the default Gemini model |
| `AZURE_OPENAI_DEPLOYMENT` | Azure deployment name (default: `gpt-4o-mini`) |
| `AZURE_OPENAI_API_VERSION` | Azure API version (default: `2024-12-01-preview`) |
| `OPENAI_BASE_URL` | Custom base URL for OpenAI-compatible endpoints |
| `OPENAI_PROVIDER_NAME` | Friendly label for the OpenAI-compatible provider (for example `Grok`) |
| `TAILORED_PROVIDER` | Default provider for the workbench (`gemini`, `azure`, `openai`, `anthropic`) |
| `TAILORED_TAILORING_PROVIDER` / `TAILORED_SCORING_PROVIDER` | Per-task provider defaults |
| `TAILORED_AZURE_MODELS` | Comma-separated Azure deployment names to show in the selector |
| `TAILORED_OPENAI_MODELS` / `TAILORED_GEMINI_MODELS` / `TAILORED_ANTHROPIC_MODELS` | Extra provider-specific model choices |
| `HUNTR_API_TOKEN` | Huntr token (if not using huntr-cli credentials) |

Notes:
- Azure model choices are deployment names, not raw catalog model IDs.
- If you point `OPENAI_BASE_URL` at another OpenAI-compatible service, set `OPENAI_PROVIDER_NAME`
  so the workbench shows the right label.

### Named provider profiles

If you want several providers side by side, especially multiple OpenAI-compatible backends such as
official OpenAI plus Groq, use named profiles:

```env
TAILORED_PROVIDER_PROFILES=openai,groq,azure,anthropic

TAILORED_PROVIDER_OPENAI_KIND=openai
TAILORED_PROVIDER_OPENAI_LABEL=OpenAI
TAILORED_PROVIDER_OPENAI_API_KEY=...
TAILORED_PROVIDER_OPENAI_DEFAULT_MODEL=gpt-5-mini

TAILORED_PROVIDER_GROQ_KIND=openai
TAILORED_PROVIDER_GROQ_LABEL=Groq
TAILORED_PROVIDER_GROQ_API_KEY=...
TAILORED_PROVIDER_GROQ_BASE_URL=https://api.groq.com/openai/v1
TAILORED_PROVIDER_GROQ_DEFAULT_MODEL=llama-3.3-70b-versatile

TAILORED_PROVIDER_AZURE_KIND=azure
TAILORED_PROVIDER_AZURE_LABEL=Azure OpenAI
TAILORED_PROVIDER_AZURE_ENDPOINT=https://your-resource.openai.azure.com
TAILORED_PROVIDER_AZURE_API_KEY=...
TAILORED_PROVIDER_AZURE_DEFAULT_MODEL=gpt-5-mini

TAILORED_PROVIDER_ANTHROPIC_KIND=anthropic
TAILORED_PROVIDER_ANTHROPIC_LABEL=Anthropic
TAILORED_PROVIDER_ANTHROPIC_API_KEY=...
TAILORED_PROVIDER_ANTHROPIC_DEFAULT_MODEL=claude-sonnet-4-5
```

Each profile gets its own label, credentials, default model, and model list. The workbench provider
selectors use these profile ids directly.

## Development

```bash
npm run dev -- tailor --help   # run CLI via tsx without building
npm run serve                  # start API server (tsx, no build needed)
npm run web                    # start Vite dev server for the React frontend
npm run build                  # compile backend to dist/ + build frontend to web/dist/
npm run web:build              # build frontend only
npm run shots:workbench        # capture prompt-focused workbench screenshots
npm run video:promo            # build a rough promo animatic from the screenshot pack
npm test                       # run tests (vitest)
npm run typecheck              # tsc --noEmit
npm run lint                   # eslint
```

The project is a monorepo with two package roots:
- **Root** (`package.json`) — CLI + API server (Node.js/TypeScript/Commander)
- **`web/`** (`web/package.json`) — React frontend (Vite + Tailwind CSS 4 + Radix UI)

Sample files for testing without real personal data are in `sample.*.md`.

## Workbench Screenshots

Use the Playwright CLI wrapper to generate a promo-ready screenshot pack for the browser workbench:

```bash
npm run shots:workbench
```

Outputs land in `output/playwright/workbench-shots/`:
- `01-resume-prompt-overview.png`
- `02-cover-prompt-overview.png`
- `03-scoring-prompt-overview.png`
- `04-scoring-prompt-panel.png`
- `05-results-panel.png`
- `06-source-huntr-overview.png`
- `07-source-panel.png`
- `08-documents-overview.png`
- `09-appearance-overview.png`
- `10-appearance-panel.png`
- `11-export-actions-resume.png`
- `12-export-actions-cover.png`

Notes:
- The script auto-detects the Codex `playwright` skill wrapper at `~/.codex/skills/playwright/scripts/playwright_cli.sh`.
- Set `PWCLI` if you want to use a different Playwright CLI wrapper or binary.
- Pass `--headed` to watch the capture flow live: `npm run shots:workbench -- --headed`
- Pass `--url http://127.0.0.1:4312` if you already have the workbench running and do not want the script to start its own server.
