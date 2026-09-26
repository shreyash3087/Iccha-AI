# ICCHA AI

> Voice-to-website AI for Indian retail shop owners.  
> बस बोलिए — ICCHA AI आपकी दुकान के लिए एक खूबसूरत वेबसाइट बना देगा।

---

## What It Does

A shop owner opens the app, taps one button, and talks in Hindi or Hinglish.  
ICCHA AI looks up their business on Google Maps, fills in missing details through conversation, and generates a live storefront website — automatically.

**Current status: Phase 1 (Pipeline Baseline)**  
The voice pipeline is wired end-to-end. STT → LLM → TTS works. Hindi + English conversation is live. Website generation is Phase 4.

---

## Repository Layout

```
IcchaAI/
├── backend/      Python LiveKit agent (VAD + STT + LLM + TTS)
├── frontend/     Next.js 14 web client (Hindi-first UI)
├── README.md     This file
├── ARCHITECTURE.md   Living architecture reference
└── DEVELOPMENT.md    Dev setup and commands
```

---

## Quick Start

### Prerequisites

- Python 3.10–3.14
- Node.js 18+
- [uv](https://docs.astral.sh/uv/getting-started/installation/) — Python package manager
- A LiveKit Cloud account (free tier works): https://cloud.livekit.io

### 1. Backend (Python Agent)

```bash
cd backend

# Copy credentials
cp .env.example .env.local
# Fill in LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET

# Install dependencies
uv sync --dev

# Run tests (must all pass before starting the agent)
uv run pytest tests/ -v

# Start the agent in dev mode (connects to LiveKit Cloud)
uv run python -m iccha.server dev
```

### 2. Frontend (Next.js App)

```bash
cd frontend

# Copy credentials
cp .env.example .env.local
# Fill in LIVEKIT_API_KEY, LIVEKIT_API_SECRET, NEXT_PUBLIC_LIVEKIT_URL

# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:3000
```

### 3. Test the full flow

1. Start the backend agent (`uv run python -m iccha.server dev`)
2. Start the frontend (`npm run dev`)
3. Open http://localhost:3000
4. Click "अपनी वेबसाइट बनाएं"
5. Allow microphone permission
6. Speak in Hindi or English — ICCHA responds

---

## Architecture Overview

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full system diagram.

```
Browser → /api/token (JWT) → LiveKit SFU → Python Agent
           (Next.js)          (Frankfurt)    (STT→LLM→TTS)
```

---

## Phase Status

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Environment + scaffold | ✅ Done |
| 1 | Core pipeline (hello world) | ✅ Done |
| 2 | STT/LLM/TTS benchmarking | ⬜ Next |
| 3 | Conversation flow + extraction | ⬜ Planned |
| 4 | Website generation | ⬜ Planned |
| 5 | Delivery + edit loop | ⬜ Planned |
| 6 | Real-user testing + tuning | ⬜ Planned |
| 7 | Launch readiness | ⬜ Planned |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Agent framework | LiveKit Agents 1.8 |
| VAD | Silero (auto via AgentSession) |
| Turn detection | MultilingualModel (99.4% TPR on Hindi) |
| STT | AssemblyAI Universal-3.5 Pro (Phase 1) |
| LLM | Google Gemma 4 31B via LiveKit Inference (Phase 1) |
| TTS | Fish Audio s2.1-pro via LiveKit Inference (Phase 1) |
| Frontend | Next.js 14 App Router + Tailwind CSS |
| SFU | LiveKit Cloud (Frankfurt, `wss://iccha-ai-i6qk3vmk.livekit.cloud`) |
