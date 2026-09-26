"""
TTS benchmark runner.

Tests each TTS provider and measures:
  - TTFB (Time To First Byte): wall-clock from request to first audio chunk
  - Total synthesis latency: time to receive all audio
  - Audio duration: how long the synthesised speech is
  - RTF (Real-Time Factor): synthesis_time / audio_duration (< 1.0 is real-time capable)

Also runs a pronunciation test: feeds known difficult Indian names/phrases
and captures audio for manual subjective review.

Providers tested:
  BASELINE  Cartesia Sonic-3 "Indian Lady" voice via LiveKit Inference
  CANDIDATE Cartesia Sonic-3 with different voice IDs (to find better Hindi pronunciation)
  CANDIDATE Smallest.ai Lightning via direct API (requires SMALLEST_AI_API_KEY)

Test phrases chosen to stress-test Indian name pronunciation:
  - Common Indian place names (Lajpat Nagar, Chandni Chowk, Andheri)
  - Hindi numerals and prices
  - Hinglish code-switched sentences
  - Shop/product names with tricky phonemes
"""

from __future__ import annotations

import asyncio
import base64
import logging
import os
import time
from dataclasses import dataclass
from pathlib import Path

import httpx
import wave

from livekit.plugins import smallestai
from livekit.agents.utils import http_context

logger = logging.getLogger(__name__)

AUDIO_OUT_DIR = Path(__file__).parent.parent.parent.parent.parent / "bench_results" / "tts_samples"

# ── Test phrases ──────────────────────────────────────────────────────────────

TTS_PHRASES = [
    # Basic Hindi greeting (should be easy)
    {"id": "tts_001", "text": "नमस्ते! मैं ICCHA हूँ। आपकी मदद करने के लिए यहाँ हूँ।"},
    # Shop name with difficult consonant clusters
    {"id": "tts_002", "text": "आपकी दुकान का नाम शर्मा जनरल स्टोर है, है ना?"},
    # Code-switched Hinglish (natural speech pattern)
    {"id": "tts_003", "text": "Bahut accha! Ab hum aapke products ke baare mein baat karte hain।"},
    # Place names (common source of mispronunciation)
    {"id": "tts_004", "text": "क्या आपकी दुकान लाजपत नगर, अंधेरी, या चांदनी चौक में है?"},
    # Prices with numerals
    {"id": "tts_005", "text": "आपके बासमती चावल की कीमत तीन सौ पचास रुपये प्रति किलो है।"},
    # Name callout (the problematic case from Phase 1)
    {"id": "tts_006", "text": "धन्यवाद श्री अग्रवाल जी! आपकी वेबसाइट बनाने में हमें ख़ुशी होगी।"},
    # English names embedded in Hindi (Hinglish)
    {"id": "tts_007", "text": "Aapka shop Gupta Mobile Centre, Sector 18, Noida mein hai?"},
    # Long confirmation sentence
    {"id": "tts_008", "text": "मैंने नोट किया: आपकी दुकान का नाम राम कृष्ण मेडिकल स्टोर है, सेक्टर बारह नोएडा में, और आप सोमवार से शनिवार सुबह नौ बजे से रात नौ बजे तक खुले रहते हैं।"},
]


# ── Result dataclass ──────────────────────────────────────────────────────────

@dataclass
class TTSResult:
    provider: str
    phrase_id: str
    text: str
    ttfb_ms: float           # Time to first audio byte
    total_ms: float          # Total synthesis time
    audio_bytes: int = 0     # Size of received audio
    audio_duration_ms: float = 0.0  # Estimated duration of synthesised audio
    rtf: float = 0.0         # Real-time factor (total_ms / audio_duration_ms)
    saved_path: str | None = None
    error: str | None = None

    @property
    def ok(self) -> bool:
        return self.error is None and self.audio_bytes > 0


def _estimate_duration_ms(audio_bytes: int, sample_rate: int = 24000, channels: int = 1, bit_depth: int = 16) -> float:
    """Estimate WAV duration from raw PCM byte count."""
    bytes_per_sample = bit_depth // 8
    bytes_per_second = sample_rate * channels * bytes_per_sample
    if bytes_per_second == 0:
        return 0.0
    # Subtract WAV header (~44 bytes) for raw PCM estimate
    pcm_bytes = max(0, audio_bytes - 44)
    return (pcm_bytes / bytes_per_second) * 1000.0


# ── Provider runners ──────────────────────────────────────────────────────────

async def _run_cartesia(
    phrase: dict,
    client: httpx.AsyncClient,
    voice_id: str,
    provider_label: str,
) -> TTSResult:
    """
    Cartesia Sonic-3 via direct Cartesia REST API (streaming).
    Requires CARTESIA_API_KEY in .env.local.
    Get free API key at: https://play.cartesia.ai/keys
    """
    api_key = os.environ.get("CARTESIA_API_KEY", "")
    if not api_key:
        return TTSResult(provider_label, phrase["id"], phrase["text"], 0, 0,
                         error="CARTESIA_API_KEY not set — get key at play.cartesia.ai/keys")

    AUDIO_OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = AUDIO_OUT_DIR / f"{provider_label}_{phrase['id']}.wav"

    t0 = time.perf_counter()
    ttfb_ms = 0.0
    total_audio = b""

    try:
        async with client.stream(
            "POST",
            "https://api.cartesia.ai/tts/bytes",
            headers={
                "X-API-Key": api_key,
                "Cartesia-Version": "2024-06-10",
                "Content-Type": "application/json",
            },
            json={
                "model_id": "sonic-3",
                "voice": {"mode": "id", "id": voice_id},
                "language": "hi",
                "transcript": phrase["text"],
                "output_format": {
                    "container": "wav",
                    "encoding": "pcm_f32le",
                    "sample_rate": 24000,
                },
            },
            timeout=30.0,
        ) as resp:
            if resp.status_code != 200:
                err_body = await resp.aread()
                total_ms = (time.perf_counter() - t0) * 1000
                return TTSResult(provider_label, phrase["id"], phrase["text"], 0, total_ms,
                                 error=f"HTTP {resp.status_code}: {err_body[:200]}")

            async for chunk in resp.aiter_bytes(chunk_size=4096):
                if chunk:
                    if not total_audio:
                        ttfb_ms = (time.perf_counter() - t0) * 1000
                    total_audio += chunk

        total_ms = (time.perf_counter() - t0) * 1000
        out_path.write_bytes(total_audio)
        duration = _estimate_duration_ms(len(total_audio), bit_depth=32)  # f32le = 32-bit
        rtf = total_ms / duration if duration > 0 else 0.0

        return TTSResult(
            provider=provider_label,
            phrase_id=phrase["id"],
            text=phrase["text"],
            ttfb_ms=ttfb_ms,
            total_ms=total_ms,
            audio_bytes=len(total_audio),
            audio_duration_ms=duration,
            rtf=rtf,
            saved_path=str(out_path),
        )

    except Exception as e:
        total_ms = (time.perf_counter() - t0) * 1000
        return TTSResult(provider_label, phrase["id"], phrase["text"], ttfb_ms, total_ms,
                         error=str(e))


async def _run_smallest_ai(
    phrase: dict,
    tts: smallestai.TTS,
    provider_label: str,
) -> TTSResult:
    """
    Smallest.ai Lightning TTS via official LiveKit persistent WebSocket streaming.
    Measures true real-time Time-To-First-Byte and stream completion.
    """
    provider = provider_label
    AUDIO_OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = AUDIO_OUT_DIR / f"{provider}_{phrase['id']}.wav"

    t0 = time.perf_counter()
    ttfb_ms = 0.0
    pcm_chunks = []
    total_bytes = 0

    try:
        stream = tts.synthesize(phrase["text"])
        async for frame in stream:
            if ttfb_ms == 0.0:
                ttfb_ms = (time.perf_counter() - t0) * 1000
            data = bytes(frame.frame.data)
            pcm_chunks.append(data)
            total_bytes += len(data)

        total_ms = (time.perf_counter() - t0) * 1000

        with wave.open(str(out_path), "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(24000)
            wf.writeframes(b"".join(pcm_chunks))

        duration = _estimate_duration_ms(total_bytes)
        rtf = total_ms / duration if duration > 0 else 0.0

        return TTSResult(
            provider=provider,
            phrase_id=phrase["id"],
            text=phrase["text"],
            ttfb_ms=ttfb_ms,
            total_ms=total_ms,
            audio_bytes=total_bytes,
            audio_duration_ms=duration,
            rtf=rtf,
            saved_path=str(out_path),
        )

    except Exception as e:
        total_ms = (time.perf_counter() - t0) * 1000
        return TTSResult(provider, phrase["id"], phrase["text"], ttfb_ms, total_ms, error=str(e))


# ── Benchmark orchestrator ────────────────────────────────────────────────────

# Cartesia voice IDs to test — Indian Lady (current) + alternatives
CARTESIA_VOICES = [
    # Current Phase 1 voice
    ("3b554273-4299-48b9-9aaf-eefd438e3941", "cartesia-indian-lady"),
    # Alternative: try Cartesia's alternate Hindi voice
    ("41534e16-2966-4c6b-9670-111411def906", "cartesia-hindi-alt"),
]


async def run_tts_benchmark() -> list[TTSResult]:
    """
    Run all TTS providers against the phrase corpus.
    Returns flat list of TTSResult.
    Audio files are saved to bench_results/tts_samples/ for manual listening.
    """
    results: list[TTSResult] = []
    api_key = os.environ.get("SMALLEST_AI_API_KEY") or os.environ.get("SMALLEST_API_KEY", "")

    async with http_context.open():
        sunidhi_tts = (
            smallestai.TTS(
                api_key=api_key,
                model="lightning_v3.1",
                voice_id="sunidhi",
                language="hi",
            )
            if api_key
            else None
        )
        devansh_tts = (
            smallestai.TTS(
                api_key=api_key,
                model="lightning_v3.1",
                voice_id="devansh",
                language="hi",
            )
            if api_key
            else None
        )

        if sunidhi_tts:
            sunidhi_tts.prewarm()
        if devansh_tts:
            devansh_tts.prewarm()
        await asyncio.sleep(0.5)

        async with httpx.AsyncClient() as client:
            for phrase in TTS_PHRASES:
                logger.info("TTS benchmark: phrase=%s", phrase["id"])

                tasks = []
                # Cartesia voices via direct Cartesia REST API
                for voice_id, label in CARTESIA_VOICES:
                    tasks.append(_run_cartesia(phrase, client, voice_id, label))
                # Smallest.ai (sunidhi - female Hindi, devansh - male Hindi) via real-time WebSocket
                if sunidhi_tts:
                    tasks.append(_run_smallest_ai(phrase, sunidhi_tts, "smallestai-sunidhi"))
                if devansh_tts:
                    tasks.append(_run_smallest_ai(phrase, devansh_tts, "smallestai-devansh"))

                phrase_results = await asyncio.gather(*tasks, return_exceptions=False)
                results.extend(phrase_results)

                for r in phrase_results:
                    status = "✓" if r.ok else "✗"
                    logger.info(
                        "  [%s] %s | TTFB=%.0fms | total=%.0fms | RTF=%.2f | %s",
                        status, r.provider, r.ttfb_ms, r.total_ms, r.rtf,
                        f"saved: {Path(r.saved_path).name}" if r.saved_path else r.error,
                    )

                await asyncio.sleep(0.3)

    return results
