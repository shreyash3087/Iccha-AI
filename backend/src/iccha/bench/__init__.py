"""
ICCHA AI — Phase 2 Benchmarking Framework
==========================================

Structure:
  bench/
    __init__.py        — this file
    audio.py           — test audio corpus (Hindi retail utterances, WAV bytes)
    stt.py             — STT provider runners + WER calculation
    llm.py             — LLM provider runners + extraction accuracy
    tts.py             — TTS provider runners + TTFB measurement
    report.py          — Result aggregation + Rich table/Markdown output
    run.py             — CLI entrypoint: `uv run python -m iccha.bench.run`

Design principles:
  - Every benchmark call is async and measured with wall-clock time.
  - Results are written to bench_results/YYYY-MM-DDTHH-MM-SS.json so we
    can compare runs across time.
  - No mock data — all calls hit real APIs. Requires GROQ_API_KEY and
    DEEPGRAM_API_KEY in .env.local for Phase 2 providers (optional;
    the harness skips providers with missing keys and reports N/A).
  - The Phase 1 baseline (LiveKit Inference) is always included using
    the existing LIVEKIT_* credentials already in .env.local.
"""
