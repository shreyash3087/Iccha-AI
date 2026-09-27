# ICCHA AI — Backend (LiveKit Vernacular Voice Agent)

The Python real-time voice intelligence engine for **ICCHA AI**, powering conversational onboarding, vernacular speech recognition, real-time Google Places verification, and dynamic storefront generation for Indian retail merchants.

---

## 🏗️ Architecture & Core Components

```
backend/
├── src/iccha/
│   ├── server.py         # LiveKit Worker entrypoint (dev & start modes)
│   ├── agent.py          # IcchaAgent session logic, live state machine, tools
│   ├── models.py         # Pydantic v2 schemas: BusinessProfile, OfferingItem, SiteSection
│   ├── prompts.py        # Vernacular prompts (10 Indian languages) & system instructions
│   ├── config.py         # Settings & environment variable validation
│   └── tools/
│       ├── places.py     # Google Places API (Text Search & Place Details)
│       ├── vision.py     # Menu & handwritten rate card OCR extraction
│       ├── vision_cli.py # CLI wrapper for frontend subprocess execution
│       └── unsplash.py   # High-resolution contextual hero photography
└── tests/                # 32 pytest unit and integration test suites
```

### How It Works:
1. **WebRTC Voice Stream:** The merchant speaks via browser microphone. Audio streams over WebRTC to the LiveKit SFU.
2. **Real-time Pipeline:** The agent runs speech-to-text (Deepgram / Groq Whisper), LLM conversational reasoning (Gemma / Llama / Gemini), and expressive text-to-speech.
3. **Google Places Verification:** During the call, the agent identifies the shop name and locality, queries Google Places API, and pushes structured candidates to the frontend over WebRTC DataChannel.
4. **DataChannel Synchronization:** Whenever the business profile changes (hours, products, tagline, colors), `BUSINESS_PROFILE_UPDATE` events are broadcast to the browser in real time.
5. **No Local Disk Dependency in Cloud:** While local development writes a fallback JSON to disk, production deployments broadcast directly via WebRTC DataChannel to the frontend, which syncs directly with **Supabase PostgreSQL**.

---

## ⚡ Quick Start

### 1. Prerequisites
- Python 3.10 – 3.13
- [uv](https://docs.astral.sh/uv/getting-started/installation/) (recommended fast package manager)
- LiveKit Cloud account (or self-hosted LiveKit server)

### 2. Installation

```bash
cd backend

# Copy environment template
cp .env.example .env.local

# Install dependencies into virtual environment
uv sync --dev
```

### 3. Environment Variables (`.env.local`)

```env
# LiveKit Cloud Project
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# LLM & Voice Providers
GROQ_API_KEY=your_groq_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key # optional if using Groq Whisper

# Google Places API (for shop verification)
GOOGLE_PLACES_API_KEY=your_google_places_key
GOOGLE_API_KEY=your_google_places_key

# Hero Photography (optional)
UNSPLASH_ACCESS_KEY=your_unsplash_key
```

### 4. Running the Agent

```bash
# Development mode (auto-reload on code changes)
uv run python -m iccha.server dev

# Production worker mode
uv run python -m iccha.server start
```

### 5. Running Automated Tests

```bash
uv run pytest tests/ -v
```

---

## 🚀 Cloud Deployment Options

Because the voice agent is a **long-running background worker** that maintains persistent WebRTC connections to the LiveKit SFU, it should be deployed on a persistent worker platform (not a serverless function like Vercel).

### Option A: Railway (Recommended)
1. Fork or push this repository to GitHub.
2. In [Railway](https://railway.app), create a **New Project** → **Deploy from GitHub repo**.
3. Set **Root Directory** to `/backend`.
4. Add the environment variables (`LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `GROQ_API_KEY`, `GOOGLE_PLACES_API_KEY`).
5. Set the **Start Command** to:
   ```bash
   uv run python -m iccha.server start
   ```

### Option B: Render (Background Worker)
1. In [Render](https://render.com), create a **New Background Worker**.
2. Connect your repository.
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `curl -LsSf https://astral.sh/uv/install.sh | sh && uv sync`
   - **Start Command:** `uv run python -m iccha.server start`
4. Add all environment variables in the Render dashboard.

### Option C: Fly.io / Docker / VPS
A standard `Dockerfile` using `ghcr.io/astral-sh/uv:python3.11-bookworm-slim`:
```dockerfile
FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY src ./src
ENV PATH="/app/.venv/bin:$PATH"
CMD ["python", "-m", "iccha.server", "start"]
```
Run with `docker run -d --env-file .env.local iccha-agent`.
