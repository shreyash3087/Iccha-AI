"""
STT benchmark runner — direct provider APIs.

LiveKit Inference has no standalone REST endpoint (it's SDK-only over WebSocket).
This benchmark calls providers directly:

  BASELINE  AssemblyAI Universal-3.5 Pro — direct AssemblyAI REST API
            Uses LIVEKIT_API_KEY/SECRET for auth via their token endpoint,
            OR ASSEMBLYAI_API_KEY if set directly.
  CANDIDATE Deepgram Nova-3 (multi) — direct Deepgram REST API
            Requires DEEPGRAM_API_KEY.

AssemblyAI direct API:
  POST https://api.assemblyai.com/v2/upload   (upload audio)
  POST https://api.assemblyai.com/v2/transcript (submit job)
  GET  https://api.assemblyai.com/v2/transcript/{id} (poll for result)
  Auth: Authorization: <ASSEMBLYAI_API_KEY>

  Note: LiveKit Inference is a reseller of AssemblyAI — you can get your own
  AssemblyAI API key for free at assemblyai.com. Add ASSEMBLYAI_API_KEY to .env.local.
  Until then this provider will be skipped with a clear message.
"""

from __future__ import annotations

import asyncio
import logging
import os
import re
import time
from dataclasses import dataclass, field
from typing import Any

import httpx

from iccha.bench.audio import CorpusItem, get_wav_bytes

logger = logging.getLogger(__name__)


# ── Result dataclass ──────────────────────────────────────────────────────────

@dataclass
class STTResult:
    provider: str
    item_id: str
    transcript: str
    ttft_ms: float
    total_ms: float
    wer: float
    cer: float
    error: str | None = None

    @property
    def ok(self) -> bool:
        return self.error is None


# ── WER / CER ─────────────────────────────────────────────────────────────────

def _tokenize(text: str) -> list[str]:
    text = text.lower()
    text = re.sub(r"[।,\.\!\?\-\"\'₹\u200b\u200c\u200d]", " ", text)
    return [t for t in text.split() if t]


def _edit_distance(ref: list[Any], hyp: list[Any]) -> int:
    n, m = len(ref), len(hyp)
    dp = list(range(m + 1))
    for i in range(1, n + 1):
        prev, dp[0] = dp[0], i
        for j in range(1, m + 1):
            temp = dp[j]
            if ref[i - 1] == hyp[j - 1]:
                dp[j] = prev
            else:
                dp[j] = 1 + min(prev, dp[j - 1], dp[j])
            prev = temp
    return dp[m]


def compute_wer(reference_tokens: list[str], hypothesis: str) -> float:
    hyp_tokens = _tokenize(hypothesis)
    if not reference_tokens:
        return 0.0
    return min(1.0, _edit_distance(reference_tokens, hyp_tokens) / len(reference_tokens))


def compute_cer(reference: str, hypothesis: str) -> float:
    ref_chars = list(reference.lower().replace(" ", ""))
    hyp_chars = list(hypothesis.lower().replace(" ", ""))
    if not ref_chars:
        return 0.0
    return min(1.0, _edit_distance(ref_chars, hyp_chars) / len(ref_chars))


# ── Provider runners ──────────────────────────────────────────────────────────

async def _run_assemblyai(
    item: CorpusItem,
    client: httpx.AsyncClient,
) -> STTResult:
    """
    AssemblyAI Universal-3.5 Pro via direct AssemblyAI REST API.
    Upload audio → submit job → poll → get transcript.
    Requires ASSEMBLYAI_API_KEY in .env.local.
    """
    provider = "assemblyai-universal35"
    wav = get_wav_bytes(item)
    if wav is None:
        return STTResult(provider, item.id, "", 0, 0, 1.0, 1.0, "No audio file")

    api_key = os.environ.get("ASSEMBLYAI_API_KEY", "")
    if not api_key:
        return STTResult(provider, item.id, "", 0, 0, 1.0, 1.0,
                         "ASSEMBLYAI_API_KEY not set — get free key at assemblyai.com")

    headers = {"authorization": api_key}
    t0 = time.perf_counter()

    try:
        # Step 1: Upload audio
        upload_resp = await client.post(
            "https://api.assemblyai.com/v2/upload",
            headers=headers,
            content=wav,
            timeout=30.0,
        )
        if upload_resp.status_code != 200:
            return STTResult(provider, item.id, "", 0, (time.perf_counter() - t0) * 1000,
                             1.0, 1.0, f"Upload failed: {upload_resp.status_code}")
        audio_url = upload_resp.json()["upload_url"]

        # Step 2: Submit transcription job
        job_resp = await client.post(
            "https://api.assemblyai.com/v2/transcript",
            headers={**headers, "content-type": "application/json"},
            json={
                "audio_url": audio_url,
                "speech_model": "universal",  # Universal = Universal-3.5 Pro
                "language_code": "hi",
            },
            timeout=15.0,
        )
        if job_resp.status_code != 200:
            return STTResult(provider, item.id, "", 0, (time.perf_counter() - t0) * 1000,
                             1.0, 1.0, f"Job submit failed: {job_resp.status_code}")

        job_id = job_resp.json()["id"]
        ttft_ms = (time.perf_counter() - t0) * 1000  # Time until job accepted

        # Step 3: Poll for completion (typically 1-5s)
        for _ in range(30):  # Max 30s
            await asyncio.sleep(1.0)
            poll_resp = await client.get(
                f"https://api.assemblyai.com/v2/transcript/{job_id}",
                headers=headers,
                timeout=10.0,
            )
            data = poll_resp.json()
            status = data.get("status")
            if status == "completed":
                total_ms = (time.perf_counter() - t0) * 1000
                transcript = data.get("text", "")
                wer = compute_wer(item.reference_tokens, transcript)
                cer = compute_cer(item.text, transcript)
                return STTResult(provider, item.id, transcript, ttft_ms, total_ms, wer, cer)
            elif status == "error":
                total_ms = (time.perf_counter() - t0) * 1000
                return STTResult(provider, item.id, "", ttft_ms, total_ms, 1.0, 1.0,
                                 f"Transcription error: {data.get('error')}")

        return STTResult(provider, item.id, "", ttft_ms, (time.perf_counter() - t0) * 1000,
                         1.0, 1.0, "Timeout waiting for transcript")

    except Exception as e:
        return STTResult(provider, item.id, "", 0, (time.perf_counter() - t0) * 1000,
                         1.0, 1.0, str(e))


async def _run_deepgram(
    item: CorpusItem,
    client: httpx.AsyncClient,
) -> STTResult:
    """
    Deepgram Nova-3 (multi) via direct Deepgram REST API.
    """
    provider = "deepgram-nova3"
    wav = get_wav_bytes(item)
    if wav is None:
        return STTResult(provider, item.id, "", 0, 0, 1.0, 1.0, "No audio file")

    api_key = os.environ.get("DEEPGRAM_API_KEY", "")
    if not api_key:
        return STTResult(provider, item.id, "", 0, 0, 1.0, 1.0,
                         "DEEPGRAM_API_KEY not set — get free key at console.deepgram.com")

    t0 = time.perf_counter()
    try:
        resp = await client.post(
            "https://api.deepgram.com/v1/listen",
            headers={"Authorization": f"Token {api_key}", "Content-Type": "audio/wav"},
            params={"model": "nova-3", "language": "multi", "smart_format": "true"},
            content=wav,
            timeout=30.0,
        )
        total_ms = (time.perf_counter() - t0) * 1000

        if resp.status_code != 200:
            return STTResult(provider, item.id, "", total_ms, total_ms, 1.0, 1.0,
                             f"HTTP {resp.status_code}: {resp.text[:200]}")

        data = resp.json()
        try:
            transcript = data["results"]["channels"][0]["alternatives"][0]["transcript"]
        except (KeyError, IndexError):
            transcript = ""

        wer = compute_wer(item.reference_tokens, transcript)
        cer = compute_cer(item.text, transcript)
        return STTResult(provider, item.id, transcript, total_ms, total_ms, wer, cer)

    except Exception as e:
        return STTResult(provider, item.id, "", 0, (time.perf_counter() - t0) * 1000,
                         1.0, 1.0, str(e))


# ── Benchmark orchestrator ────────────────────────────────────────────────────

async def run_stt_benchmark(corpus: list[CorpusItem]) -> list[STTResult]:
    """Run all STT providers against the full corpus."""
    results: list[STTResult] = []

    # AssemblyAI uses polling — run items sequentially to avoid flooding their API
    # Deepgram is synchronous REST — can parallelize per item
    async with httpx.AsyncClient() as client:
        for item in corpus:
            logger.info("STT benchmark: item=%s (%s)", item.id, item.text[:35])

            # Run providers concurrently per item
            tasks = [
                _run_assemblyai(item, client),
                _run_deepgram(item, client),
            ]
            item_results = await asyncio.gather(*tasks)
            results.extend(item_results)

            for r in item_results:
                status = "OK" if r.ok else "ERR"
                logger.info(
                    "  [%s] %s | WER=%.3f | %.0fms | %.35s",
                    status, r.provider, r.wer, r.total_ms,
                    r.transcript or r.error or "",
                )

            await asyncio.sleep(0.5)

    return results
