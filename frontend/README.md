# ICCHA AI — Frontend (Merchant Studio & Storefront Web App)

The Next.js 14 web client for **ICCHA AI**, providing the landing experience, interactive hands-free voice creation studio, live digital storefronts, and merchant management dashboard.

---

## 🎨 Tech Stack & Architecture

- **Framework:** Next.js 14 (App Router, React 18, TypeScript)
- **Styling:** Tailwind CSS + Vanilla CSS utilities (`#faf9f5` warm white theme, glassmorphism, responsive layouts)
- **Real-Time Voice:** `@livekit/components-react`, `livekit-client` (WebRTC audio + DataChannel)
- **Authentication:** Supabase Auth (Google OAuth) + global `AuthContext` with `localStorage` session caching
- **Database:** Supabase PostgreSQL with REST API endpoints (`/api/storefronts`, `/api/db/sync`)
- **AI Voice Edit API:** Groq Whisper STT + LLM endpoint (`/api/edit/voice`)
- **Vision Extraction:** Next.js API route (`/api/vision/extract`)

---

## 📁 Key Routes & Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `src/app/page.tsx` | Landing page with regional language switcher, hero soundwave, feature breakdown, and demo storefront link. |
| `/call` | `src/app/call/page.tsx` | Full-screen hands-free voice studio with real-time speech orb visualizer, Google Places interactive cards, and rate-card OCR upload. |
| `/temp/[slug]` | `src/app/temp/[slug]/page.tsx` | Generated live merchant storefront with Luxury template, WhatsApp ordering, printable QR standee, and LiveKit voice edit assistant. |
| `/dashboard` | `src/app/dashboard/page.tsx` | Merchant Studio dashboard displaying active storefronts, drafts, catalog stats, and direct links. |
| `/login` | `src/app/login/page.tsx` | White, elegant Google OAuth login page with destination-aware redirection. |
| `/auth/callback` | `src/app/auth/callback/page.tsx` | OAuth callback landing page that parses Supabase session tokens and navigates to the stored destination. |

---

## 🌐 Multilingual & Regional Support

ICCHA AI supports 10+ Indian languages with native scripts and phonetics:
- **Hindi (हिन्दी)**
- **Hinglish (Hindi in Latin script)**
- **Tamil (தமிழ்)**
- **Telugu (తెలుగు)**
- **Marathi (मराठी)**
- **Kannada (ಕನ್ನಡ)**
- **Gujarati (ગુજરાતી)**
- **Bengali (বাংলা)**
- **Punjabi (ਪੰਜਾਬੀ)**
- **Malayalam (മലയാളം)**
- **English**

Content is stored in clean English on the backend, allowing instant one-tap client-side switching between English and regional languages on any generated storefront.

---

## 🔑 Environment Variables

Create `.env.local` inside `frontend/` (and add these to your **Vercel Project Settings → Environment Variables**):

```env
# LiveKit Cloud Credentials
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_key
LIVEKIT_API_SECRET=your_livekit_secret
NEXT_PUBLIC_AGENT_NAME=iccha-agent

# Supabase Cloud Database & Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

# Groq API Key (for Voice Edit STT, LLM & Menu Vision OCR)
GROQ_API_KEY=your_groq_api_key

# Google Places & Unsplash (Optional for enriched previews)
GOOGLE_PLACES_API_KEY=your_google_places_key
UNSPLASH_ACCESS_KEY=your_unsplash_key
```

---

## 🚀 Deploying to Vercel

1. **Push to GitHub:** Ensure your code is pushed to your Git repository.
2. **Import into Vercel:** Go to [vercel.com/new](https://vercel.com/new) and select your repository.
3. **Configure Root Directory:** Set the **Root Directory** to `frontend`.
4. **Framework Preset:** Next.js (automatically detected).
5. **Environment Variables:** Copy all environment variables from `.env.local` into the Vercel project settings.
6. **Supabase Auth Redirect URL:**
   In your [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **URL Configuration**:
   - Set **Site URL** to your Vercel deployment URL (e.g. `https://iccha-ai.vercel.app`).
   - Add `https://iccha-ai.vercel.app/auth/callback` to **Redirect URLs**.
7. **Deploy:** Click **Deploy**. Vercel will build the production bundle and assign your live domain.

> **Note on Filesystem & Temp Sites on Vercel:**  
> On local machines, temporary website previews write to `public/temp_sites/*.json`. On Vercel, serverless runtimes have a read-only filesystem. The application automatically detects this and stores **all storefront drafts directly in Supabase Postgres**, guaranteeing that your previews and merchant dashboards work 100% seamlessly in the cloud.

---

## 🛠️ Scripts

```bash
# Start local development server with hot-reload
npm run dev

# Check TypeScript types
npx tsc --noEmit

# Production build test
npm run build

# Start production server
npm run start

# Linting
npm run lint
```

