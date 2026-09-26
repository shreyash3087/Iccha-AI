"""
LLM benchmark runner.

Tests each LLM provider on the extraction schema using realistic STT outputs.
Measures:
  - TTFT (Time To First Token): time until first streamed token appears
  - Total latency: time to complete response
  - Extraction accuracy: did the model correctly fill the JSON schema fields?
  - Function-call success rate: did the model use the tool correctly?

Test input: a curated set of "STT transcript" strings (realistic Hindi/Hinglish
shop-owner responses) fed to the extraction prompt. We do NOT rely on the STT
benchmark output so this module is independently runnable.

Providers tested:
  BASELINE  google/gemma-4-31b-it via LiveKit Inference (current Phase 1 LLM)
  CANDIDATE llama-3.3-70b-versatile via Groq API
  CANDIDATE gemma2-9b-it via Groq API (smaller/faster — check accuracy tradeoff)

Extraction schema:
  {
    "shop_name": str,
    "tagline": str | null,
    "address": str,
    "locality": str,
    "phone": str | null,
    "hours": {"open": str, "close": str, "days": str} | null,
    "products": [{"name": str, "price_inr": int | null}]
  }
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import os
import time
from dataclasses import dataclass, field

import httpx

logger = logging.getLogger(__name__)


# ── Extraction schema ─────────────────────────────────────────────────────────

EXTRACTION_SCHEMA = {
    "type": "object",
    "properties": {
        "shop_name": {"type": "string"},
        "tagline": {"type": ["string", "null"]},
        "address": {"type": "string"},
        "locality": {"type": "string"},
        "phone": {"type": ["string", "null"]},
        "hours": {
            "type": ["object", "null"],
            "properties": {
                "open": {"type": "string"},
                "close": {"type": "string"},
                "days": {"type": "string"},
            },
        },
        "products": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "price_inr": {"type": ["integer", "null"]},
                },
                "required": ["name"],
            },
        },
    },
    "required": ["shop_name", "address", "locality", "products"],
}

EXTRACTION_SYSTEM_PROMPT = """You are extracting structured data from a voice transcript of an Indian shop owner.

The shop owner may speak in Hindi, English, or Hinglish. Extract the following information:
- shop_name: The exact name of the shop as spoken
- tagline: Optional short description or slogan
- address: Full address including street/sector number
- locality: City, area or neighbourhood (e.g. "Lajpat Nagar, Delhi")
- phone: Phone number if mentioned (digit string, no formatting)
- hours: Shop opening hours if mentioned
- products: List of products/items sold, with prices in INR if mentioned

IMPORTANT:
- Return ONLY valid JSON matching the schema. No prose, no markdown.
- If a field is not mentioned, use null for optional fields.
- For products with no price, use null for price_inr.
- Translate Hindi product/place names into their Roman/English equivalent for the name field.
- Be precise — shop names and product names must exactly match what was spoken."""

EXTRACTION_USER_TEMPLATE = """Transcript: "{transcript}"

Extract the shop information from this transcript and return JSON only."""


# ── Test cases ────────────────────────────────────────────────────────────────

@dataclass
class ExtractionTestCase:
    id: str
    transcript: str  # Simulated STT output
    expected: dict   # Expected extraction fields (subset for scoring)


TEST_CASES: list[ExtractionTestCase] = [
    ExtractionTestCase(
        id="extract_001",
        transcript="मेरी दुकान का नाम शर्मा जनरल स्टोर है, लाजपत नगर दिल्ली में। हम चावल, दाल, आटा बेचते हैं। चावल तीन सौ रुपये किलो है।",
        expected={
            "shop_name": "शर्मा जनरल स्टोर",
            "locality": "Lajpat Nagar",
            "products": ["चावल", "दाल", "आटा"],
        },
    ),
    ExtractionTestCase(
        id="extract_002",
        transcript="Gupta Kirana Store hai mera, sector fifteen Gurgaon mein. Phone number hai nine eight seven six five four three two one zero. Hum subah nau baje se raat nau baje tak khule rehte hain, Sunday band.",
        expected={
            "shop_name": "Gupta Kirana Store",
            "locality": "Gurgaon",
            "phone": "9876543210",
            "hours": {"open": "9:00", "close": "21:00"},
        },
    ),
    ExtractionTestCase(
        id="extract_003",
        transcript="Agrawal Saree Bhandar. Hum ladies suits, sarees, aur lehengas bechte hain. Suit ka price hai paanch sau se teen hazaar tak.",
        expected={
            "shop_name": "Agrawal Saree Bhandar",
            "products": ["suits", "sarees", "lehengas"],
        },
    ),
    ExtractionTestCase(
        id="extract_004",
        transcript="Ram Krishna Medical Store, sector baarah Noida. Dawaiyan milti hain, surgical items bhi. Subah aath se raat aath tak. Number hai zero one two zero dash one two three four five six seven.",
        expected={
            "shop_name": "Ram Krishna Medical Store",
            "locality": "Noida",
        },
    ),
    ExtractionTestCase(
        id="extract_005",
        transcript="Patel Mobile Accessories. Screen guards, covers, chargers, earphones sab milta hai yahan. Lajpat Nagar main market, dukan number do sau solah.",
        expected={
            "shop_name": "Patel Mobile Accessories",
            "locality": "Lajpat Nagar",
            "products": ["screen guards", "covers", "chargers", "earphones"],
        },
    ),
]


# ── Result dataclass ──────────────────────────────────────────────────────────

@dataclass
class LLMResult:
    provider: str
    test_id: str
    raw_output: str
    ttft_ms: float
    total_ms: float
    parsed_json: dict | None = None
    field_accuracy: float = 0.0   # 0–1 fraction of expected fields correctly extracted
    json_valid: bool = False
    error: str | None = None

    @property
    def ok(self) -> bool:
        return self.error is None and self.json_valid


def _score_extraction(result_json: dict, expected: dict) -> float:
    """Compute field accuracy: fraction of expected fields that were correctly extracted."""
    if not expected:
        return 1.0
    correct = 0
    total = 0

    for key, exp_val in expected.items():
        total += 1
        got_val = result_json.get(key)

        if key == "products" and isinstance(exp_val, list) and isinstance(got_val, list):
            # Check if at least half the expected products are found (case-insensitive, partial match)
            got_names = [
                (p.get("name", "") if isinstance(p, dict) else str(p)).lower()
                for p in got_val
            ]
            matched = sum(
                1 for ep in exp_val
                if any(ep.lower() in gn or gn in ep.lower() for gn in got_names)
            )
            correct += matched / max(len(exp_val), 1)
        elif key == "hours" and isinstance(exp_val, dict) and isinstance(got_val, dict):
            # Partial credit for hours
            h_match = sum(
                1 for hk, hv in exp_val.items()
                if got_val.get(hk) and hv.split(":")[0] in str(got_val.get(hk, ""))
            )
            correct += h_match / max(len(exp_val), 1)
        elif key == "phone" and exp_val and got_val:
            # Strip formatting and compare digits
            exp_digits = "".join(c for c in str(exp_val) if c.isdigit())
            got_digits = "".join(c for c in str(got_val) if c.isdigit())
            correct += 1 if exp_digits == got_digits else 0
        elif key in ("shop_name", "locality"):
            # Partial match for name/locality (STT may transliterate differently)
            if got_val and exp_val:
                exp_lower = str(exp_val).lower()
                got_lower = str(got_val).lower()
                # Accept if first meaningful word matches
                exp_first = exp_lower.split()[0] if exp_lower.split() else ""
                correct += 1 if (exp_first and exp_first in got_lower) else 0
            else:
                correct += 0
        else:
            correct += 1 if got_val == exp_val else 0

    return correct / total if total > 0 else 0.0


# ── Provider runners ──────────────────────────────────────────────────────────

async def _run_livekit_gemma(
    tc: ExtractionTestCase,
    client: httpx.AsyncClient,
) -> LLMResult:
    """
    Gemma 4 31B via LiveKit Inference.
    LiveKit Inference is WebSocket/SDK-based within live sessions, no standalone REST API.
    """
    provider = "gemma4-31b-livekit"
    return LLMResult(
        provider,
        tc.id,
        "",
        0,
        0,
        error="LiveKit Inference has no standalone REST endpoint (tested live in agent session)",
    )


async def _run_groq(
    tc: ExtractionTestCase,
    client: httpx.AsyncClient,
    model: str,
    provider_label: str,
) -> LLMResult:
    """
    LLM via Groq API (streaming).
    Groq delivers 100-200ms TTFT for large models.
    """
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        return LLMResult(provider_label, tc.id, "", 0, 0,
                         error="GROQ_API_KEY not set — skipping")

    messages = [
        {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
        {"role": "user", "content": EXTRACTION_USER_TEMPLATE.format(transcript=tc.transcript)},
    ]

    t0 = time.perf_counter()
    ttft_ms = 0.0
    raw_output = ""

    try:
        async with client.stream(
            "POST",
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": messages,
                "stream": True,
                "max_tokens": 512,
                "temperature": 0.1,
            },
            timeout=60.0,
        ) as resp:
            if resp.status_code != 200:
                err_body = await resp.aread()
                total_ms = (time.perf_counter() - t0) * 1000
                return LLMResult(provider_label, tc.id, "", 0, total_ms,
                                 error=f"HTTP {resp.status_code}: {err_body[:200]}")

            async for line in resp.aiter_lines():
                if not line or not line.startswith("data: "):
                    continue
                payload = line[6:]
                if payload == "[DONE]":
                    break
                try:
                    chunk = json.loads(payload)
                    delta = chunk["choices"][0]["delta"].get("content", "")
                    if delta:
                        if not raw_output:
                            ttft_ms = (time.perf_counter() - t0) * 1000
                        raw_output += delta
                except (json.JSONDecodeError, KeyError, IndexError):
                    continue

        total_ms = (time.perf_counter() - t0) * 1000
        return _parse_llm_result(provider_label, tc, raw_output, ttft_ms, total_ms)

    except Exception as e:
        total_ms = (time.perf_counter() - t0) * 1000
        return LLMResult(provider_label, tc.id, raw_output, ttft_ms, total_ms, error=str(e))


def _parse_llm_result(
    provider: str,
    tc: ExtractionTestCase,
    raw_output: str,
    ttft_ms: float,
    total_ms: float,
) -> LLMResult:
    """Extract JSON from raw LLM output and score it."""
    import re
    # Strip markdown code fences if present
    clean = re.sub(r"```(?:json)?\s*", "", raw_output).strip().rstrip("`").strip()
    # Find JSON object
    json_match = re.search(r"\{[\s\S]*\}", clean)
    parsed = None
    json_valid = False
    accuracy = 0.0

    if json_match:
        try:
            parsed = json.loads(json_match.group(0))
            json_valid = True
            accuracy = _score_extraction(parsed, tc.expected)
        except json.JSONDecodeError:
            pass

    return LLMResult(
        provider=provider,
        test_id=tc.id,
        raw_output=raw_output,
        ttft_ms=ttft_ms,
        total_ms=total_ms,
        parsed_json=parsed,
        field_accuracy=accuracy,
        json_valid=json_valid,
    )


# ── Benchmark orchestrator ────────────────────────────────────────────────────

async def run_llm_benchmark() -> list[LLMResult]:
    """
    Run all LLM providers against the extraction test cases.
    Returns flat list of LLMResult (one per provider × test case).
    """
    results: list[LLMResult] = []

    async with httpx.AsyncClient() as client:
        for tc in TEST_CASES:
            logger.info("LLM benchmark: case=%s", tc.id)

            tasks = [
                _run_livekit_gemma(tc, client),
                _run_groq(tc, client, "qwen/qwen3.8-27b", "qwen38-27b-groq"),
                _run_groq(tc, client, "openai/gpt-oss-20b", "gpt-oss-20b-groq"),
            ]
            case_results = await asyncio.gather(*tasks, return_exceptions=False)
            results.extend(case_results)

            for r in case_results:
                status = "✓" if r.ok else "✗"
                logger.info(
                    "  [%s] %s | accuracy=%.2f | TTFT=%.0fms | total=%.0fms",
                    status, r.provider, r.field_accuracy, r.ttft_ms, r.total_ms,
                )

            await asyncio.sleep(0.5)

    return results
