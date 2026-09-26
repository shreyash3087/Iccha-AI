# ICCHA AI — Phase 2 Benchmark Report (Updated Live Metrics)

**Date:** September 25, 2026  
**Git Branch:** `phase-2-benchmarking`  
**Test Suite:** Automated Latency, Accuracy, & Real-World Streaming Benchmark  
**Dataset:** 15 recorded Hindi retail speech samples, 5 structured extraction test cases, 8 stress-test Hindi/Hinglish TTS phrases.

---

## 🏆 Executive Summary & Selected Stack

| Pipeline Stage | Selected Provider | Runner-Up | Speed / Latency Impact | Accuracy / Quality Impact |
| :--- | :--- | :--- | :--- | :--- |
| **STT (Speech-to-Text)** | **Deepgram Nova-3** (`multi`) | AssemblyAI Universal-3.5 | **824ms** mean (vs 3607ms) — **4.4x faster** | **0.459** WER (vs 0.557) — **18% lower error rate** |
| **LLM (Extraction & Tool Use)** | **Groq Qwen 3.8-27B** | Groq GPT-OSS-20B | **206ms** TTFT (vs 876ms) — **4.2x faster** | **82%** Field Accuracy, **100%** Valid JSON |
| **TTS (Text-to-Speech)** | **Smallest.ai Lightning** (`sunidhi` voice via WebSocket) | Cartesia Sonic-3 | **~440–680ms** conversational TTFB, **1588ms** total (vs 2479ms HTTP) — **36% faster** | Authentic Indian Hindi persona, native Hindi grammar & pronunciation |

---

## 1. STT (Speech-to-Text) Benchmark

Evaluated on 15 Hindi retail domain speech samples (item queries, price quotations, addresses, shop names).

| Provider | Model | Mean Latency | p95 Latency | Mean WER ↓ | Mean CER ↓ | Success Rate |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Deepgram** | `nova-3` (`language=multi`) | **824 ms** | **2015 ms** | **0.459** | **0.479** | **14/15 (93%)** |
| **AssemblyAI** | `universal` (Universal-3.5 Pro) | 3607 ms | 5270 ms | 0.557 | 0.498 | 15/15 (100%) |

### Key Findings:
1. **Latency:** Deepgram Nova-3 responds in **824ms** on average compared to **3607ms** for AssemblyAI (**2.8 seconds saved per turn**).
2. **Hindi & Code-Switching Accuracy:** Deepgram Nova-3 achieved lower Word Error Rate (0.459 vs 0.557) and Character Error Rate (0.479 vs 0.498) on spoken Hindi shop names and numerals.
3. **Decision:** Deepgram Nova-3 is locked in as the primary STT engine.

---

## 2. LLM (Extraction & Structured Schema) Benchmark

Evaluated on realistic Indian shop-owner conversational transcripts extracting: `shop_name`, `tagline`, `address`, `locality`, `phone`, `hours`, and `products` with INR prices.

| Provider / Model | Mean TTFT | p95 TTFT | Mean Total Latency | Field Accuracy ↑ | JSON Schema Valid % |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Groq Qwen 3.8-27B** (`qwen/qwen3.8-27b`) | **206 ms** | **301 ms** | **470 ms** | **82%** | **100%** |
| **Groq GPT-OSS-20B** (`openai/gpt-oss-20b`) | 876 ms | 964 ms | 954 ms | 77% | 80% |
| **LiveKit Inference Gemma 4 31B** | Baseline | — | — | — | (SDK-only in live session) |

### Key Findings:
1. **Speed:** Groq Qwen 3.8-27B streamed first tokens in **206ms** and completed full JSON generation in **470ms**.
2. **Reliability:** Qwen achieved **100% strict JSON schema compliance** without markdown leaks or trailing garbage, correctly parsing complex Hindi phone numbers, multi-product lists, and rupee amounts.
3. **Decision:** Qwen 3.8-27B via Groq is the chosen extraction and tool-calling engine for Phase 3+.

---

## 3. TTS (Text-to-Speech) Benchmark: Real-World WebSocket Streaming

Evaluated on 8 phonetically diverse Hindi and Hinglish phrases (greetings, shop names, numerals, place names like Lajpat Nagar & Chandni Chowk, and formal honorifics).

> **Note on Methodology:** Previous benchmark numbers reflected Smallest.ai's HTTP REST API (`/get_speech`), which buffered entire audio files before returning. The updated metrics below reflect **actual real-world persistent WebSocket streaming** (`wss://api.smallest.ai/waves/v1/tts/live`) via `livekit-plugins-smallestai` with pre-warmed connection pooling, matching the production pipeline.

| Provider | Voice / ID | Protocol | Mean TTFB | Conversational TTFB (Short Turns) | Mean Total | RTF (Real-Time Factor) ↓ |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Smallest.ai Lightning v3.1** | `sunidhi` (Female Hindi) | **Persistent WebSocket** | **897 ms** | **~440 – 680 ms** | **1588 ms** | **0.343** |
| **Smallest.ai Lightning v3.1** | `devansh` (Male Hindi) | **Persistent WebSocket** | 851 ms | ~450 – 700 ms | 1729 ms | 0.344 |
| *Smallest.ai (Previous HTTP REST)* | `sunidhi` | HTTP REST (Batch) | 1066 ms | ~1066 ms | 2479 ms | 0.555 |
| **Cartesia Sonic-3** | `Indian Lady` | HTTP Stream | 168 ms | ~150 ms | 858 ms | 0.195 |
| **Cartesia Sonic-3** | `Hindi Alt` | HTTP Stream | 160 ms | ~150 ms | 825 ms | 0.233 |

### Key Findings & Decision:
1. **WebSocket Streaming Speedup:** Moving from HTTP REST to native LiveKit WebSocket streaming slashed total synthesis time from **2479ms to 1588ms** (a **36% / 891ms reduction**).
2. **Real-Time Factor (RTF):** Smallest.ai's RTF is **0.343**, synthesizing speech nearly **3x faster than real-time playback**.
3. **Vernacular Hindi Naturalness:** While Cartesia boasts lower TTFB, Smallest.ai (`sunidhi`) offers noticeably superior Hindi vernacular prosody, natural Hindi intonation, and native handling of Indian shopkeeper dialogue and honorifics ("श्री अग्रवाल जी", "चांदनी चौक", "लाजपत नगर").
4. **Decision:** **Smallest.ai Sunidhi** via persistent WebSocket streaming is selected as the primary voice of ICCHA AI.

---

## 4. End-to-End Pipeline Latency Comparison

| Stage | Phase 1 Baseline (AssemblyAI + Gemma + Cartesia) | Phase 2 Production Stack (Deepgram Nova-3 + Groq Qwen + Smallest.ai Sunidhi WS) | Latency Delta |
| :--- | :---: | :---: | :---: |
| **STT Latency** | ~3607 ms | **~824 ms** | **-2783 ms** |
| **LLM TTFT** | ~500–700 ms | **~206 ms** | **-350 ms** |
| **TTS TTFB (Conversational)** | ~231 ms | **~500 ms** | +269 ms |
| **Total Turn Latency** | **~4.3 – 4.5 seconds** | **~1.5 – 1.6 seconds** | **~2.8 seconds saved (~3x faster!)** |
