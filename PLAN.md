# Voice-to-Website AI for Retail Shop Owners

### Technical Architecture, Stack Decisions, and Build Plan

---

## 1. Problem Statement and MVP Scope

Small retail shop owners in India often already have a partial online presence (Google Maps listing, reviews, photos) that they do not know how to use or extend. Complex website builders require typing, design skills, and content planning that this audience does not have.

**The MVP:** a shop owner opens the app, taps a button, and talks. A responsive web application (works on desktop and mobile browsers) runs a Hindi-first voice agent that looks up the business on Google Places, confirms or fills in missing details through natural conversation, and generates a live storefront website automatically.

**Explicit non-goals for v1:** custom domains, payment integration, inventory sync, multi-page sites, telephony/PSTN access. One scrollable landing page, reachable through the app, is the target output.

- **Telephony/PSTN** is excluded because the product is app-based (browser or mobile, button-triggered), not a phone-call flow. This line exists to prevent scope creep back toward the earlier IVR-style design that was reconsidered during architecture planning. A phone-call fallback for owners without smartphone access remains a plausible future feature, not a v1 concern.
- **Inventory sync** is excluded because the MVP produces a static informational storefront (name, products, hours, contact), not a live e-commerce catalog. Real-time stock accuracy requires integrating with a POS/inventory system that most target shop owners do not have, and is a separate, much harder product than what v1 is scoped to deliver. Product/price updates happen conversationally through the voice-edit loop, not through an automated backend sync.

---

## 2. System Architecture

```
User taps "Book a Call" in browser/mobile
        │
        ▼
Client SDK (LiveKit JS/Web SDK) → room.connect() → mic permission requested
        │
        ▼  (WebRTC: SRTP/UDP, DTLS-encrypted)
LiveKit Cloud SFU  ◄────────────────────────────────────────┐
        │                                                     │
        ▼ (agent subscribes to user's audio track)            │
Agent Worker Process                                          │
   │                                                           │
   ├─► Silero VAD ─► speech presence / interruption trigger    │
   │                                                           │
   ├─► STT (streaming) ─► partial + final transcripts          │
   │                                                           │
   ├─► Turn Detector (MultilingualModel, dynamic endpointing)  │
   │       └─► decides: commit turn now, or wait longer        │
   │                                                           │
   ├─► LLM (function calling) ─► structured JSON extraction    │
   │       └─► Google Places API lookup (async, hold-message   │
   │           pattern plays cached TTS while this runs)       │
   │                                                           │
   └─► TTS (streaming) ─► synthesized response audio ──────────┘
        │
        ▼ (agent publishes audio track, WebRTC back to client)
User hears the agent's response

[Separate, triggered on "publish"]
Structured JSON → Website template renderer → static page → hosted at
shopname.yourapp.in → link + QR code delivered via WhatsApp/SMS
```

**Key architectural decisions baked into this diagram:**

- WebRTC exists only on the client-to-SFU leg (both directions). All STT/LLM/TTS calls are server-to-server, plain HTTP/WebSocket streaming, not WebRTC.
- Cascaded pipeline (STT → LLM → TTS), not a speech-to-speech omni model, chosen for language coverage, controllability, and debuggability.
- The turn detector operates on STT transcripts, not raw audio, so it depends on STT already being wired in.

---

## 3. Component Decisions

| Component | Decision | Status |
| --- | --- | --- |
| Client | Responsive web app (single codebase, browser + mobile browser), `room.connect()` on button tap | Locked |
| SFU | LiveKit Cloud, Build/Ship plan | Locked |
| Telephony | None. Removed after clarifying this is an app, not a PSTN flow | Locked |
| Base VAD | Silero VAD | Locked |
| Endpointing | LiveKit turn detector, `MultilingualModel()`, dynamic/EMA-based delay (not fixed `min_endpointing_delay`) | Locked |
| STT | Deepgram Nova-3 (multi) as integration default; benchmark against Smallest.ai Pulse before final lock | Needs benchmarking |
| LLM | Llama 3.3 70B (Groq) or Gemma (Cerebras) via LiveKit Inference; Gemini Flash as fallback if Hindi function-calling accuracy is insufficient | Needs benchmarking |
| TTS | Smallest.ai Lightning | Provisionally locked, verify latency under real load |
| Business lookup | Google Places API (Text Search), with Places attribution requirements followed | Locked |

### Rationale summary

**SFU — LiveKit Cloud.** Managed STUN/TURN, no need to build ICE/DTLS-SRTP/congestion control by hand. Migration to self-hosted LiveKit OSS is deferred until call volume or GPU co-location needs justify the switch.

**VAD + Endpointing.** Raw silence-duration VAD is insufficient for Hindi and code-switched speech (pause patterns differ from English). The `MultilingualModel()` turn detector has a benchmarked 99.4% true positive rate and 96.3% true negative rate on Hindi, the best of its 14 supported languages. Dynamic (EMA-based) endpointing adapts the wait time to each caller's own rhythm instead of using one static number for everyone.

**STT.** Deepgram Nova-3 (multi) is the proven default in LiveKit's own reference stack. Smallest.ai's Pulse model has an official LiveKit plugin (`livekit-plugins-smallestai`) with a documented \~64ms time-to-first-token for streaming transcription, and a `language="north_indic"` / `language="multi"` mode built for exactly this use case. Both are credible; a real benchmark on recorded Hindi retail-owner speech is required before locking one in, since STT accuracy errors corrupt every downstream field silently.

**LLM.** Groq and Cerebras custom silicon deliver 100–200ms time-to-first-token, which standard GPU-hosted inference cannot match. This is necessary to hit a sub-500ms total response budget. The open risk is Hindi function-calling accuracy on the structured extraction schema (shop name, address, products, hours), which needs direct testing against real transcripts, not assumed from general model reputation.

**TTS.** Smallest.ai's Lightning API has an official LiveKit plugin, documents Hindi-English code-switched synthesis as a first-class capability (not an edge case), and publishes a sub-100ms latency claim. This must be verified under real concurrent load before being treated as production-safe.

**Business lookup.** Google Places Text Search, using the owner's spoken business name and locality. Reviews, ratings, photos, hours, and address are pulled if a listing exists; products and prices are not available from Places and must still be collected conversationally.

---

## 4. Latency Budget

| Stage | Realistic cost | Notes |
| --- | --- | --- |
| Client → SFU (WebRTC) | 30–80ms | Network-dependent, minimize via nearest LiveKit Cloud region |
| Silero VAD (speech presence) | Sub-frame, effectively negligible |  |
| Turn detector inference | \~25ms (multilingual model) | Cheap; not the real cost |
| Endpointing delay (static mode, confident turn) | \~500ms default, tunable down to \~250–350ms | Applies only if dynamic mode is not used; binary min/max decision |
| Endpointing delay (static mode, uncertain turn) | 3–6s (max_endpointing_delay) | Should rarely trigger given Hindi's high confidence scores |
| Endpointing delay (dynamic/EMA mode, chosen for this project) | Interpolated between min_delay and max_delay based on a rolling average of the caller's own recent pause behavior, not a binary jump between the two | No published benchmark figure exists yet; behavior inferred from LiveKit's own source code, must be measured empirically in Phase 2/6 testing. The max_delay ceiling still applies as a safety net for genuinely ambiguous pauses, dynamic mode does not remove it |
| STT streaming (partial → final) | \~64ms (Smallest.ai Pulse, published) to \~100–150ms (typical streaming STT) | Confirm actual figure for chosen provider |
| LLM time-to-first-token | 100–200ms (Groq/Cerebras) | Depends on prompt length and function-calling overhead |
| TTS time-to-first-byte | Sub-100ms (Smallest.ai Lightning, published) | Verify under real load |
| SFU → Client (WebRTC) | 30–80ms | Same as inbound leg |

**Target:** sub-500ms perceived response time for confident, well-formed turns, achieved primarily through stage overlap (streaming STT into LLM, streaming LLM output into TTS) rather than any single component's raw speed. The endpointing delay is the single highest-leverage tuning variable in this entire budget.

---

## 5. Alternatives and Benchmarking Plan

No component below is fully closed until tested against real Hindi retail-owner speech, not clean studio audio or synthetic test cases.

### STT benchmark

- **Candidates:** Deepgram Nova-3 (multi), Smallest.ai Pulse (`north_indic`/`multi` mode)
- **Test set:** 20–30 recorded real or realistic Hindi/code-switched utterances covering shop names, addresses, numbers, and prices
- **Pass bar:** word error rate on domain-specific terms (shop names, place names, numerals), latency to first partial transcript, accuracy on rapid code-switching

### LLM benchmark

- **Candidates:** Llama 3.3 70B (Groq), Gemma (Cerebras), Gemini Flash (fallback)
- **Test set:** the same transcripts run through the actual extraction schema (shop_name, tagline, products\[\], hours{}, address, phone)
- **Pass bar:** function-calling success rate on Hindi input, correct field extraction rate, time-to-first-token under real prompt lengths

### TTS benchmark

- **Candidates:** Smallest.ai Lightning, Cartesia Sonic-3 (fallback)
- **Test set:** the fixed conversation script phrases, played under simulated concurrent load
- **Pass bar:** time-to-first-byte under load, pronunciation accuracy on Hindi place/product names, naturalness of code-switched sentences

### Endpointing tuning

- **Method:** record real test calls once STT is wired in, log per-language threshold behavior, adjust `min_endpointing_delay` and the dynamic/EMA parameters based on observed premature-cutoff versus awkward-pause complaints from test users

---

## 6. Pricing

### LiveKit Cloud (Build/Ship plan, illustrative figures from the pricing calculator)

| Line item | Example cost | Applies to this project? |
| --- | --- | --- |
| Agent session | $0.0100/min | Yes |
| Telephony | $0.0100/min | No — web/mobile client, no PSTN |
| LLM (example: Gemma 4 31B) | $0.0014/min | Depends on chosen model, varies |
| STT (example: AssemblyAI Universal-3.5 Pro) | $0.0075/min | Depends on chosen provider |
| TTS (example: Fish Audio S2.1 Pro) | $0.0090/min | Depends on chosen provider |
| Observability | $0.0100/min | Optional, recommended during MVP for debugging |

**Important structural note:** the figures above apply when using models available inside LiveKit Inference's own marketplace, billed together per minute. Smallest.ai's STT/TTS run through an official LiveKit plugin (`livekit-plugins-smallestai`) but are billed directly by Smallest.ai using their own credit system, separately from LiveKit's per-minute inference charges. Groq and Cerebras appear as officially spotlighted model partners in LiveKit's documentation; confirm during implementation whether they are billed through LiveKit Inference or require a direct API key billed separately. Budget planning should treat this as **two potential billing relationships**, not one bundled number, until the exact integration path for each chosen provider is confirmed.

**Action item:** once STT/LLM/TTS benchmarking above concludes, re-run LiveKit's own pricing calculator with the exact final provider selections rather than relying on the illustrative figures here, since per-model pricing changes.

---

## 7. Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Misheard prices, names, or addresses | Always read back extracted values via TTS before finalizing; never trust a single-pass transcription silently |
| Regional accent/dialect variance | Test STT against real regional audio early, not only clean studio speech |
| No product photos available | Fall back to WhatsApp photo request, then category-matched stock image, clearly flagged as placeholder in the admin dashboard |
| Owner drops off mid-conversation | Persist partial extracted JSON after every answer; allow resuming rather than restarting |
| Displaying Google reviews without proper attribution | Use the official Places API response format and required "Powered by Google" attribution; never scrape review text directly |
| No existing Google Business Profile | Offer to help create one, but scope honestly: full automation is not possible since Google requires owner-side verification (postcard/phone/video) |
| Reliance on default endpointing values | Explicit testing pass against real Hindi calls before launch, not accepting library defaults |

---

## 8. Action Plan

### Phase 0 — Environment and accounts (Week 1)

- Set up LiveKit Cloud project (Build/Ship plan), confirm nearest region to Indian users
- Set up API access: Deepgram, Smallest.ai (already have credits), Groq, Cerebras, Google Places
- Install `livekit-agents`, `livekit-plugins-smallestai`, `livekit-plugins-silero`, `livekit-plugins-turn-detector`

### Phase 1 — Core pipeline, "hello world" agent (Week 1–2)

- Build a minimal agent: Silero VAD + turn detector + one STT + one LLM + one TTS, wired end to end
- Confirm `room.connect()` works from a basic web client (browser mic to agent to browser speaker)
- Validate the WebRTC transport and SFU connection work reliably before adding conversation logic

### Phase 2 — STT/LLM/TTS benchmarking (Week 2–3)

- Run the benchmarking plan in Section 5 against real or realistic Hindi test utterances
- Lock final STT, LLM, and TTS choices based on results, not assumption
- Tune endpointing thresholds using the same test recordings

### Phase 3 — Conversation flow and extraction schema (Week 3–4)

- Implement the full interview script: greeting, business name/location, Google Places lookup and confirmation, reviews/photos handling, product-by-product collection, final confirmation
- Implement the intent classification layer (direct answer, correction, unclear, off-topic, silence, explicit skip) ahead of every question handler
- Wire in the hold-message pattern (cached TTS) for the Places API lookup delay

### Phase 4 — Website generation (Week 4–5)

- Build 3–5 fixed HTML/React templates mapped to the JSON schema
- Auto-select template by business category
- Deploy generated pages to per-shop subdomains

### Phase 5 — Delivery and edit loop (Week 5–6)

- WhatsApp/SMS link delivery with QR code generation
- Voice-based post-launch editing (re-enter the STT → LLM extraction loop, diff against existing JSON, re-render changed sections only)

### Phase 6 — Real-user testing and tuning (Week 6–7)

- Run real shop owners through the full flow
- Re-tune endpointing, re-check STT/LLM/TTS accuracy against live usage, not just the benchmark set
- Fix conversation script gaps surfaced by real usage patterns

### Phase 7 — Launch readiness (Week 7–8)

- Re-run LiveKit pricing calculator with final locked providers for accurate cost projection
- Confirm Google Places attribution compliance
- Final latency audit against the Section 4 budget under real concurrent load