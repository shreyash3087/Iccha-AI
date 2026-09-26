# ICCHA AI — Development Guide

## Environment Setup

### Python (Backend)

We use [uv](https://docs.astral.sh/uv/getting-started/installation/) for Python dependency management.
It is significantly faster than pip and handles virtual environments automatically.

```bash
cd backend
uv sync --dev        # Creates .venv, installs all deps including dev tools
```

The `.venv` is created inside `backend/` — do not commit it.

### Node.js (Frontend)

Standard npm. Requires Node.js 18+.

```bash
cd frontend
npm install
```

---

## Daily Commands

### Backend

```bash
# Run the agent (dev mode — hot reload, connects to LiveKit Cloud)
uv run python -m iccha.server dev

# Run all tests
uv run pytest tests/ -v

# Run linting
uv run ruff check src/ tests/

# Run formatting check
uv run ruff format --check src/ tests/

# Auto-fix formatting
uv run ruff format src/ tests/

# Type checking
uv run mypy src/
```

### Frontend

```bash
# Dev server (hot reload)
npm run dev         # → http://localhost:3000

# Type check + production build (run before every commit)
npm run build

# Linting
npm run lint
```

---

## Environment Variables

### Backend (`backend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `LIVEKIT_URL` | ✅ | WebSocket URL: `wss://iccha-ai-i6qk3vmk.livekit.cloud` |
| `LIVEKIT_API_KEY` | ✅ | LiveKit API key |
| `LIVEKIT_API_SECRET` | ✅ | LiveKit API secret |
| `AGENT_NAME` | ❌ | Agent routing name (default: `iccha-agent`) |
| `LOG_LEVEL` | ❌ | Python log level (default: `INFO`) |
| `GOOGLE_PLACES_API_KEY` | ❌ | Phase 3 only — leave blank |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `LIVEKIT_API_KEY` | ✅ | Server-side only — signs JWT tokens |
| `LIVEKIT_API_SECRET` | ✅ | Server-side only — never sent to browser |
| `NEXT_PUBLIC_LIVEKIT_URL` | ✅ | SFU URL — safe to expose to browser |
| `NEXT_PUBLIC_AGENT_NAME` | ❌ | Agent name (default: `iccha-agent`) |

---

## Code Conventions

### Python

- **Formatter + Linter**: ruff (configured in `pyproject.toml`)
- **Type hints**: required on all public functions
- **Docstrings**: required on all public classes and functions
- **Imports**: ruff auto-sorts; `from __future__ import annotations` at top of every file
- **Config**: all env access goes through `iccha.config.get_settings()` — never `os.environ` directly
- **Prompts**: all system prompts live in `iccha.prompts` — never inline in agent logic

### TypeScript (Frontend)

- **Components**: `"use client"` directive only where needed (client-side interactivity)
- **Env access**: server env vars (no `NEXT_PUBLIC_`) used only in API routes and server components
- **Styling**: CSS custom properties from `globals.css` for all design tokens — no hard-coded hex values in component files

---

## Testing Philosophy

### What we test automatically

| Test | File | What it verifies |
|------|------|-----------------|
| Config loading | `test_config.py` | All env var validation and defaults |
| Agent structure | `test_agent_smoke.py` | Prompt quality, tool existence, stub behaviour |

### What we do NOT test automatically (yet)

| What | Why | When |
|------|-----|------|
| Full voice conversation | Requires live LiveKit session | Phase 2 — scenario YAML files |
| Hindi STT accuracy | Requires real audio recordings | Phase 2 benchmarking |
| LLM extraction quality | Requires real transcripts | Phase 2 benchmarking |
| Latency measurement | Requires production traffic | Phase 6 tuning |

### Test isolation rule

Tests that validate missing-field behaviour **must** pass `_env_file=None` to `Settings()`.
Otherwise, the real `.env.local` on disk fills in values and the test passes vacuously.
See `test_config.py` for the established pattern.

---

## What to Do in the Next Session (Phase 2)

Phase 2 is **STT/LLM/TTS benchmarking**. Before touching any code, read PLAN.md §5.

### Step 1 — Prepare test audio clips

Record or find 20–30 realistic Hindi/Hinglish retail utterances:
- Shop names: "Sharma General Store", "बेस्ट मोबाइल शॉप"
- Addresses: "Lajpat Nagar, New Delhi"
- Products: "char kilo aalu", "250 gram chai patti"
- Numbers: "teen sau rupaye", "₹450 ka dena"
- Code-switching: "Actually mera shop subah 9 baje khulta hai"

Store them in `backend/tests/fixtures/audio/` as `.wav` files.

### Step 2 — STT benchmark

Compare word error rate (WER) and TTFT for:
- `assemblyai/universal-3-5-pro` (current)
- `deepgram/nova-2` with `language=hi`
- Smallest.ai Pulse (`north_indic` mode) — needs `livekit-plugins-smallestai`

Create `backend/tests/benchmark_stt.py` following the pattern in `test_agent_smoke.py`.

### Step 3 — LLM benchmark

Run the structured extraction schema against each LLM candidate.  
Schema: `{ shop_name, tagline, products[], hours{}, address, phone }`

Test with Hindi transcripts from Step 1. Measure:
- Function-calling success rate
- Field extraction accuracy
- TTFT under real prompt length

### Step 4 — TTS benchmark

Compare TTFB and Hindi pronunciation quality for:
- `fishaudio/s2.1-pro` (current)
- Smallest.ai Lightning — needs `SMALLEST_API_KEY`
- Cartesia Sonic-3 (fallback)

### Step 5 — Lock providers

Update `backend/src/iccha/server.py` with benchmarked choices.  
Update `backend/src/iccha/agent.py` LLM selection.  
All changes go through the same test → lint → format gate.
