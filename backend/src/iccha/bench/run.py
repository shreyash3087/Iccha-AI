"""
ICCHA AI Phase 2 Benchmark — CLI runner.

Usage:
    uv run python -m iccha.bench.run                # Run everything
    uv run python -m iccha.bench.run --stt-only     # STT benchmark only
    uv run python -m iccha.bench.run --llm-only     # LLM benchmark only
    uv run python -m iccha.bench.run --tts-only     # TTS benchmark only
    uv run python -m iccha.bench.run --regen-audio  # Regenerate audio corpus

Credentials required (in backend/.env.local):
  LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET  (Phase 1 baseline — required)
  GROQ_API_KEY           (Groq LLM candidates — optional, skipped if missing)
  DEEPGRAM_API_KEY       (Deepgram STT candidate — optional, skipped if missing)
  SMALLEST_AI_API_KEY    (Smallest.ai TTS — optional, skipped if missing)

The benchmark runner loads .env.local automatically.
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import os
import sys
from pathlib import Path

# Load env vars before anything else — must find backend/.env.local
# __file__ = backend/src/iccha/bench/run.py
# parent×4  = backend/
from dotenv import load_dotenv
import os, sys

_bench_file = Path(__file__).resolve()
_backend_dir = _bench_file.parent.parent.parent.parent  # .../backend/
load_dotenv(_backend_dir / ".env.local")
load_dotenv(_backend_dir / ".env")

# Force UTF-8 output so Rich's table arrows/checkmarks render on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("iccha.bench")


async def main(args: argparse.Namespace) -> None:
    from iccha.bench.audio import ensure_corpus
    from iccha.bench.report import print_console_report, save_report

    if args.stt_only or args.llm_only or args.tts_only:
        run_stt = args.stt_only
        run_llm = args.llm_only
        run_tts = args.tts_only
    else:
        run_stt = run_llm = run_tts = True

    logger.info("=" * 60)
    logger.info("ICCHA AI — Phase 2 Benchmark")
    logger.info("Credentials detected:")
    logger.info("  LIVEKIT_API_KEY:     %s", "✓" if os.environ.get("LIVEKIT_API_KEY") else "✗ MISSING")
    logger.info("  ASSEMBLYAI_API_KEY:  %s", "✓" if os.environ.get("ASSEMBLYAI_API_KEY") else "✗ (AssemblyAI skipped)")
    logger.info("  DEEPGRAM_API_KEY:    %s", "✓" if os.environ.get("DEEPGRAM_API_KEY") else "✗ (Deepgram skipped)")
    logger.info("  GROQ_API_KEY:        %s", "✓" if os.environ.get("GROQ_API_KEY") else "✗ (Groq skipped)")
    logger.info("  CARTESIA_API_KEY:    %s", "✓" if os.environ.get("CARTESIA_API_KEY") else "✗ (Cartesia direct skipped)")
    logger.info("  SMALLEST_AI_API_KEY: %s", "✓" if os.environ.get("SMALLEST_AI_API_KEY") else "✗ (Smallest.ai skipped)")
    logger.info("=" * 60)

    stt_results = []
    llm_results = []
    tts_results = []

    # ── STT ───────────────────────────────────────────────────────────────────
    if run_stt:
        logger.info("\n[Phase 2] STT Benchmark — generating/loading audio corpus...")
        corpus = await ensure_corpus(regen=args.regen_audio)
        logger.info("Corpus ready: %d items", len(corpus))

        from iccha.bench.stt import run_stt_benchmark
        logger.info("\n[Phase 2] Running STT providers...")
        stt_results = await run_stt_benchmark(corpus)

    # ── LLM ───────────────────────────────────────────────────────────────────
    if run_llm:
        from iccha.bench.llm import run_llm_benchmark
        logger.info("\n[Phase 2] Running LLM extraction benchmark...")
        llm_results = await run_llm_benchmark()

    # ── TTS ───────────────────────────────────────────────────────────────────
    if run_tts:
        from iccha.bench.tts import run_tts_benchmark
        logger.info("\n[Phase 2] Running TTS providers...")
        tts_results = await run_tts_benchmark()

    # ── Report ─────────────────────────────────────────────────────────────────
    logger.info("\n[Phase 2] Generating report...")
    print_console_report(stt_results, llm_results, tts_results)
    report_path = save_report(stt_results, llm_results, tts_results)

    logger.info("\n✅ Benchmark complete!")
    logger.info("   Report: %s", report_path)
    logger.info("   TTS audio: %s", report_path.parent / "tts_samples")
    logger.info("\nNext steps:")
    logger.info("  1. Open the Markdown report and review automated metrics.")
    logger.info("  2. Listen to TTS audio samples in bench_results/*/tts_samples/")
    logger.info("  3. Fill in the Recommendation section of the report.")
    logger.info("  4. Update agent.py and server.py with the winning providers.")


def cli() -> None:
    parser = argparse.ArgumentParser(
        prog="iccha-bench",
        description="ICCHA AI Phase 2 — STT/LLM/TTS benchmarking harness",
    )
    parser.add_argument("--stt-only", action="store_true", help="Run STT benchmark only")
    parser.add_argument("--llm-only", action="store_true", help="Run LLM benchmark only")
    parser.add_argument("--tts-only", action="store_true", help="Run TTS benchmark only")
    parser.add_argument("--all", action="store_true", default=True, help="Run all benchmarks (default)")
    parser.add_argument("--regen-audio", action="store_true", help="Regenerate audio corpus even if cached")
    args = parser.parse_args()

    asyncio.run(main(args))


if __name__ == "__main__":
    cli()
