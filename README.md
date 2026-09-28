# ICCHA AI (इच्छा AI)

> **Voice-to-Website AI for Indian Merchants & Local Businesses.**  
> Multilingual Voice AI supporting **Hindi, Hinglish, Tamil, Telugu, Marathi, Kannada, Gujarati, Bengali, Punjabi, Malayalam, and English**.

---

## 🌟 What is ICCHA AI?

Over 60 million local merchants in Bharat (kiranas, restaurants, dhabas, boutiques, salons, sweet shops, repair stores) lack an online presence because traditional website builders require desktop computers, English literacy, and complex catalog configuration.

**ICCHA AI solves this with voice.**  
A shopkeeper simply taps the call button and speaks naturally in their mother tongue. In under 2 minutes, ICCHA AI:
1. **Understands their business** via hands-free conversational voice AI.
2. **Verifies their location on Google Maps** with live on-screen candidate cards.
3. **Scans menus & rate cards** via AI Vision OCR.
4. **Generates a live, mobile-first luxury storefront** with WhatsApp ordering and printable counter QR standees.
5. **Stores content in clean English** with an instant native-language client toggle for local customers.
6. **Enables live voice editing** — just speak to update prices, items, or taglines anytime.

---

## 🚀 Key Features

- **Multilingual Vernacular Voice Agent:** Built on LiveKit Agents, Groq Whisper STT, Google Gemma / LLM inference, and expressive TTS. Supports 10+ Indian languages (Hindi, Hinglish, Tamil, Telugu, Marathi, Kannada, Gujarati, Bengali, Punjabi, Malayalam, English).
- **English-First Stored Content + Native Toggle:** The AI agent talks to the merchant in their mother tongue, but stores storefront content in clean, professional English. Customers can flip between English and the regional native script with a single tap in the navbar.
- **Google Places API Verification:** Real-time lookup of the shop's physical location, star rating, customer review count, and official address. Interactive cards stream directly to the merchant's screen during the voice call.
- **AI Vision Menu Scanning:** Upload a photo of a handwritten rate card, restaurant menu, or board — the vision pipeline automatically extracts item names, prices, and categories into the catalog.
- **Single Luxury Storefront Template:** Crafted with light, elegant aesthetics (`#faf9f5` warm white palette, glassmorphism, responsive navigation, WhatsApp checkout cart, and clean typography).
- **Printable Counter QR Standee:** Generates a ready-to-print acrylic standee with the merchant's brand name, verified badges, and high-resolution QR code for physical shop counters.
- **Hands-Free Live Voice Editing:** Merchants can click *"AI se website badlein"* on their live storefront and speak changes directly (*"Paneer Tikka 290 kar do"*, *"Tagline badlo"*, *"Ye item remove karo"*). Updates reflect instantly via LiveKit DataChannel.
- **Cloud Merchant Dashboard & Google OAuth:** Integrated with Supabase Postgres. Once logged in, merchant sessions persist across all pages with global `AuthContext` and a unified navigation bar.

---

## 🏗️ Repository Architecture

```
IcchaAI/
├── backend/                  # Python LiveKit Voice Agent
│   ├── src/iccha/
│   │   ├── agent.py          # IcchaAgent logic, DataChannel handlers, tools
│   │   ├── server.py         # LiveKit Worker entrypoint
│   │   ├── models.py         # BusinessProfile, ProductItem, SiteSection schemas
│   │   ├── prompts.py        # Multilingual prompts & language maps
│   │   ├── config.py         # Settings & environment validation
│   │   └── tools/
│   │       ├── places.py     # Google Places API (Search & Details)
│   │       ├── vision.py     # Menu / rate card OCR pipeline
│   │       └── unsplash.py   # Curated HD hero photography
│   └── tests/                # 32 automated pytest test suites
│
├── frontend/                 # Next.js 14 App Router (React 18 + Tailwind CSS)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx    # Root layout with AuthProvider & regional metadata
│   │   │   ├── page.tsx      # Landing page (HomeClient)
│   │   │   ├── call/         # Full-screen hands-free voice studio
│   │   │   ├── dashboard/    # Merchant Studio (manage drafts, approved stores, QR)
│   │   │   ├── login/        # White & elegant Google OAuth login page
│   │   │   ├── temp/[slug]/  # Live merchant storefront previews
│   │   │   ├── auth/callback # OAuth callback token handler
│   │   │   └── api/          # Next.js API routes (token, storefronts, vision, edit)
│   │   ├── components/
│   │   │   ├── AppNavbar.tsx # Unified navigation bar with language selector & auth
│   │   │   ├── VoiceSession.tsx # LiveKit audio visualizer & interview flow
│   │   │   ├── StorefrontView.tsx # Live storefront renderer & voice edit widget
│   │   │   ├── CounterQRModal.tsx # Printable counter QR standee generator
│   │   │   └── sections/     # Modular storefront sections (Hero, Highlights, Menu, Footer)
│   │   ├── context/
│   │   │   └── AuthContext.tsx # Global authentication context & localStorage mirror
│   │   └── lib/
│   │       ├── auth.ts       # Supabase OAuth & local storage session utilities
│   │       ├── livekit.ts    # LiveKit token client & language constants
│   │       ├── supabase.ts   # Supabase client initializer
│   │       └── translations.ts # Static UI translations for 10 Indian languages
│   └── public/
│       ├── logo.png          # Brand logo & favicon
│       ├── homepage_hero_bg.png
│       └── temp_sites/       # Local JSON draft persistence
└── DEVELOPMENT.md            # Detailed developer setup & testing commands
```

---

## ⚡ Quick Start

### Prerequisites
- Python 3.10–3.13
- Node.js 18+ & npm
- [uv](https://docs.astral.sh/uv/getting-started/installation/) — Fast Python package manager
- LiveKit Cloud account: https://cloud.livekit.io
- Supabase account (optional for local dev, required for cloud sync): https://supabase.com
- Google Places API Key (optional, fallbacks provided): https://console.cloud.google.com

---

### 1. Backend Setup

```bash
cd backend

# Create .env.local from example
cp .env.example .env.local
```

Configure your `.env.local`:
```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_key
LIVEKIT_API_SECRET=your_secret
GOOGLE_PLACES_API_KEY=your_google_places_key
GROQ_API_KEY=your_groq_key
```

Install dependencies & start the agent:
```bash
# Sync dependencies
uv sync --dev

# Run tests
uv run pytest tests/ -v

# Start the agent worker in dev mode
uv run python -m iccha.server dev
```

---

### 2. Frontend Setup

```bash
cd frontend

# Create .env.local
cp .env.example .env.local
```

Configure your `.env.local`:
```env
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_key
LIVEKIT_API_SECRET=your_secret
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_key
```

Install dependencies & launch the Next.js dev server:
```bash
npm install
npm run dev
```

Visit **http://localhost:3000** in your browser.

---

## ☁️ Production Deployment Guide

ICCHA AI is built as a modern distributed cloud application:
- **Frontend:** Next.js 14 deployed on **Vercel** (Serverless edge routing, SSR, ISR).
- **Backend Voice Agent:** Python worker deployed on **Railway**, **Render**, or **Fly.io** (Persistent WebRTC connections).
- **Database & Auth:** **Supabase** (PostgreSQL database, Row Level Security, Google OAuth).
- **Media & WebRTC:** **LiveKit Cloud** (Low-latency WebRTC SFU & audio pipelines).

---

### Step 1: Set Up Supabase Database & Auth

1. Go to [Supabase](https://supabase.com) and create a new project.
2. In the left navigation, open **SQL Editor** → **New Query**.
3. Copy and paste the contents of [`supabase/schema.sql`](file:///c:/Users/shrey/Desktop/VOICE/IcchaAI/supabase/schema.sql) and click **Run**.  
   *This initializes the `storefronts` and `products` tables, indexes, and Row Level Security policies.*
4. In **Authentication** → **URL Configuration**:
   - Set **Site URL** to your production frontend URL (e.g. `https://iccha-ai.vercel.app` or `http://localhost:3000`).
   - Under **Redirect URLs**, add:
     - `https://iccha-ai.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback`
5. In **Authentication** → **Providers**, enable **Google** (if using Google OAuth with Client ID & Client Secret from Google Cloud Console).
6. In **Project Settings** → **API**, copy your `Project URL` and `anon public` key.

---

### Step 2: Deploy Backend Voice Worker (Railway / Render / VPS)

The Python voice agent is a continuous worker process that listens for LiveKit room dispatches:

#### Deploying on Railway (Recommended):
1. Create a new project in [Railway.app](https://railway.app) connected to your GitHub repository.
2. Set the **Root Directory** to `backend`.
3. Add these Environment Variables in Railway:
   ```env
   LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=your_livekit_api_key
   LIVEKIT_API_SECRET=your_livekit_api_secret
   GROQ_API_KEY=your_groq_api_key
   GOOGLE_PLACES_API_KEY=your_google_places_api_key
   ```
4. Set the **Start Command**:
   ```bash
   uv run python -m iccha.server start
   ```

*(Alternatively, run as a Render Background Worker or via Docker on any Ubuntu VPS/EC2 instance — see [`backend/README.md`](file:///c:/Users/shrey/Desktop/VOICE/IcchaAI/backend/README.md)).*

---

### Step 3: Deploy Frontend to Vercel

1. Log in to [Vercel](https://vercel.com) and click **Add New...** → **Project**.
2. Select your repository.
3. In **Root Directory**, click *Edit* and select `frontend`.
4. Leave framework preset as **Next.js**.
5. In **Environment Variables**, add:
   ```env
   NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
   LIVEKIT_API_KEY=your_livekit_api_key
   LIVEKIT_API_SECRET=your_livekit_api_secret
   NEXT_PUBLIC_AGENT_NAME=iccha-agent
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GROQ_API_KEY=your_groq_api_key
   GOOGLE_PLACES_API_KEY=your_google_places_api_key
   UNSPLASH_ACCESS_KEY=your_unsplash_access_key
   ```
6. Click **Deploy**. Vercel will build and launch your live application!

> 💡 **How Temp Files & Storefront Previews Work on Vercel:**  
> On local development machines, site drafts are written to `public/temp_sites/*.json` for quick offline inspection.  
> On Vercel (where serverless file systems are read-only), **ICCHA AI automatically saves all drafts directly into Supabase Postgres** via the LiveKit WebRTC DataChannel and `/api/storefronts`. The `/temp/[slug]` route queries Supabase first, ensuring instant preview availability with zero disk dependencies.

---

## 🧪 Testing the Complete Merchant Flow

1. **Start Creation:** Open `http://localhost:3000` and click *"अपनी वेबसाइट बनाएं"* (or pick any language).
2. **Talk to ICCHA:** Say: *"Mera Flying Saucer cafe hai Indiranagar Bangalore mein, pizza pasta aur coffee bechte hain."*
3. **Google Maps Card:** Watch the Google Places candidate card appear on screen. Click to verify or say *"Haan, yehi hai"*.
4. **Instant Preview:** The agent finalizes the draft and opens the live storefront (`/temp/[slug]`).
5. **Native Language Toggle:** Switch between English and Hindi/Tamil/Marathi in the navbar.
6. **Live Voice Edit:** Click *"AI se website badlein"* and say: *"Cold coffee ka rate 180 kar do"* or *"Tagline update karo"*. The site updates live!
7. **QR Standee:** Click *"QR कोड स्टैंडी"* to preview and print the acrylic counter standee.
8. **Save to Dashboard:** Log in with Google. The site is permanently saved to your Merchant Studio dashboard.

---

## 🛡️ License

Built with ❤️ for Indian Retail Merchants by the ICCHA AI Team.  
All rights reserved © 2026 ICCHA AI.
