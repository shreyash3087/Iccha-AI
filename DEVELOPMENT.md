# ICCHA AI — Development & Operations Guide

## Environment Setup

### Python (Backend)

We use [uv](https://docs.astral.sh/uv/getting-started/installation/) for Python package management.
It creates and manages `.venv` automatically with fast, reproducible installs.

```bash
cd backend
uv sync --dev        # Creates .venv, installs all dependencies & test tools
```

### Node.js (Frontend)

Standard npm setup requiring Node.js 18+.

```bash
cd frontend
npm install
```

---

## Daily Commands

### Backend Commands

```bash
# Run agent in development mode (hot-reloads on edits, connects to LiveKit Cloud)
uv run python -m iccha.server dev

# Run all 32 automated tests
uv run pytest tests/ -v

# Run linting with Ruff
uv run ruff check src/ tests/

# Auto-fix linting issues
uv run ruff check --fix src/ tests/

# Code formatting check
uv run ruff format --check src/ tests/

# Auto-format all Python code
uv run ruff format src/ tests/
```

### Frontend Commands

```bash
# Start local Next.js dev server (with hot module replacement)
npm run dev         # → http://localhost:3000

# Type-check TypeScript codebase without emitting JS
npx tsc --noEmit

# Production bundle build
npm run build

# Start production server
npm run start
```

---

## Environment Variables Reference

### Backend (`backend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `LIVEKIT_URL` | ✅ | WebSocket URL: `wss://your-project.livekit.cloud` |
| `LIVEKIT_API_KEY` | ✅ | LiveKit API Key |
| `LIVEKIT_API_SECRET` | ✅ | LiveKit API Secret |
| `AGENT_NAME` | ❌ | Agent routing identifier (default: `iccha-agent`) |
| `LOG_LEVEL` | ❌ | Logging verbosity (default: `INFO`) |
| `GOOGLE_PLACES_API_KEY` | ✅ | Google Cloud Places API (New) for location search & details |
| `GROQ_API_KEY` | ✅ | Groq API key for Whisper STT & LLM-based voice edits |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_LIVEKIT_URL` | ✅ | LiveKit WebSocket endpoint exposed to browser client |
| `LIVEKIT_API_KEY` | ✅ | Server-side key used in `/api/token` to sign session JWTs |
| `LIVEKIT_API_SECRET` | ✅ | Server-side secret used to sign JWTs |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL for cloud persistence & Auth |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous public key for client authentication |
| `GROQ_API_KEY` | ✅ | Groq API key used by `/api/edit/voice` and `/api/vision/extract` |

---

## End-to-End Testing Workflow

### 1. Voice Interview & Site Creation
1. Open `http://localhost:3000` and tap the mic button.
2. The browser connects to `wss://...` via WebRTC and sends an audio stream to the Python LiveKit agent.
3. Speak in Hindi, English, Tamil, Marathi, or any supported Indian language:
   > *"Mera Flying Saucer cafe hai Indiranagar Bangalore mein, pizza pasta aur coffee bechte hain."*
4. As you speak, Google Places candidate cards appear dynamically on screen.
5. Confirm candidate:
   > *"Haan, pehla wala."* (or click the card directly).
6. Upload a menu photo if available. AI Vision extracts items and prices into the catalog.
7. Say *"Sab theek hai, website bana do"* to finalize.
8. The storefront opens automatically at `/temp/[slug]`.

### 2. Live Website Editing (Hands-Free)
1. On `/temp/[slug]`, click the floating button **"AI se website badlein (Live Edit)"**.
2. Speak:
   > *"Cold coffee ka price 180 kar do aur Paneer Tikka 290 kar do."*
   > *"Tagline badlo: Fresh Italian & Artisan Coffee in Indiranagar."*
3. The AI confirms the change over voice and updates the DOM in real-time via DataChannel.

### 3. QR Standee & Cloud Approval
1. Click **"QR कोड स्टैंडी"** to preview the printable acrylic counter standee.
2. Click **"Approve Website"** or **"Login"** to authenticate via Google OAuth.
3. The site is linked to your merchant account in Supabase and displayed in `/dashboard`.

---

## Code Standards & Best Practices

- **Multilingual Support:** ICCHA AI is built for Bharat. System prompts, greetings, and UI translations support 10+ Indian languages (Hindi, Hinglish, Tamil, Telugu, Marathi, Kannada, Gujarati, Bengali, Punjabi, Malayalam, English).
- **English-First Storage:** Storefront content (shop name, tagline, catalog item names, descriptions, addresses) is stored in clean English on the backend so search engines index it properly, while the client UI provides native vernacular translation toggles.
- **Strict Privacy & Isolation:** Draft sites stay in local/session memory until the merchant authenticates with Google.
