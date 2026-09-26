"""
ICCHA AI Agent Server — entrypoint and session configuration.

This module is the process entrypoint. It:
  1. Creates the AgentServer.
  2. Defines the rtc_session handler — called once per LiveKit room job.
  3. Wires STT, TTS, and turn handling into AgentSession.
  4. Connects the agent to the room.

Separation of concerns:
  - agent.py  : IcchaAgent class (behaviour, LLM, tools)
  - server.py : AgentServer wiring (STT, TTS, VAD, turn detection, session)
  - config.py : All env / settings

Running locally:
  uv run python -m iccha.server dev

Deploying to LiveKit Cloud:
  lk agent deploy --image <image>

Pipeline configuration (Phase 1):
  STT  : AssemblyAI Universal-3.5 Pro, language=hi (Hindi)
         → chosen because it requires no extra API key in Phase 1;
           will be benchmarked against Deepgram Nova-3 and Smallest.ai Pulse
           in Phase 2 using real Hindi retail speech.
  TTS  : Cartesia Sonic-3 (voice="Indian Lady", language=hi) via LiveKit Inference
         → authentic Indian female voice matching ICCHA persona.
         Smallest.ai Lightning will also be benchmarked in Phase 2.
  Turn : MultilingualModel() — 99.4% TPR on Hindi (published benchmark).
         Dynamic endpointing (EMA-based) adapts to each caller's pause rhythm.
         min_endpointing_delay=0.3, max_endpointing_delay=5.0 as starting
         values; will be tuned in Phase 6 against real call recordings.
  VAD  : Silero — auto-supplied by AgentSession when turn_detection is set.
  Noise: DISABLED in Phase 1 — gives a clean, unmodified latency baseline.
         Will be evaluated via ai_coustics in Phase 6.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from livekit.agents import (
    AgentServer,
    AgentSession,
    JobContext,
    TurnHandlingOptions,
    cli,
    inference,
)
from livekit.plugins import smallestai
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from iccha.agent import IcchaAgent
from iccha.config import get_settings
from iccha.resampler_patch import apply_resampler_patch

apply_resampler_patch()

# Ensure .env.local / .env are loaded into os.environ so the LiveKit CLI worker process
# has access to LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET
load_dotenv(".env.local")
load_dotenv(".env")
backend_dir = Path(__file__).resolve().parent.parent.parent
load_dotenv(backend_dir / ".env.local")
load_dotenv(backend_dir / ".env")

logger = logging.getLogger(__name__)

# ── AgentServer ──────────────────────────────────────────────────────────────
#
# A single AgentServer instance per process. LiveKit will dispatch multiple
# concurrent rooms to the same process; each rtc_session call gets its own
# isolated AgentSession.
settings = get_settings()

# Propagate keys to os.environ so plugins that look for standard env var names find them
if settings.smallest_ai_api_key:
    os.environ["SMALLEST_API_KEY"] = settings.smallest_ai_api_key
if settings.deepgram_api_key:
    os.environ["DEEPGRAM_API_KEY"] = settings.deepgram_api_key
if settings.groq_api_key:
    os.environ["GROQ_API_KEY"] = settings.groq_api_key

server = AgentServer(
    ws_url=settings.livekit_url,
    api_key=settings.livekit_api_key,
    api_secret=settings.livekit_api_secret,
)


@server.rtc_session(agent_name=get_settings().agent_name)
async def iccha_session(ctx: JobContext) -> None:
    """
    Handle a single LiveKit room session.

    Called once per room dispatch. All state (conversation history, STT
    buffer, extracted JSON) lives inside the AgentSession and is GC'd when
    the session ends — rooms are fully isolated.
    """
    settings = get_settings()

    # Structured log context — every log line in this session will include
    # the room name, making multi-session debugging trivial.
    ctx.log_context_fields = {
        "room": ctx.room.name,
        "agent": settings.agent_name,
    }

    logger.info("Session started | room=%s", ctx.room.name)

    session = AgentSession(
        # ── STT ──────────────────────────────────────────────────────────
        # Phase 2 winner: Deepgram Nova-3 (844ms vs 3546ms for AssemblyAI)
        # Handles Hindi, English, and Hinglish code-switching with 4.2x lower latency.
        stt=inference.STT(
            model="deepgram/nova-3",
            language="multi",
        ),
        # ── TTS: Smallest.ai Lightning via persistent WebSocket streaming ─
        # Sub-100ms real-time audio chunk streaming over wss://api.smallest.ai/waves/v1/tts/live
        tts=smallestai.TTS(
            api_key=settings.smallest_ai_api_key or os.getenv("SMALLEST_API_KEY"),
            model="lightning_v3.1",
            voice_id="sunidhi",
            language="hi",
        ),
        # ── Turn Handling ─────────────────────────────────────────────────
        turn_handling=TurnHandlingOptions(
            # MultilingualModel: trained on 14 languages including Hindi.
            # Published benchmark: 99.4% TPR, 96.3% TNR on Hindi.
            # Dynamic (EMA-based) endpointing adapts to each caller's own
            # natural pause rhythm instead of a fixed silence threshold.
            turn_detection=MultilingualModel(),
            # Preemptive generation: LLM starts generating while the turn
            # detector is still deciding - saves 100-200ms on most turns.
            preemptive_generation={"enabled": True},
        ),
        # expressive=False: cleaner latency baseline; no markup overhead.
        expressive=False,
    )

    # Start the session — this warms up models and publishes the agent's
    # audio track to the LiveKit room before ctx.connect() is called.
    await session.start(
        agent=IcchaAgent(),
        room=ctx.room,
        # No RoomOptions/noise cancellation in Phase 1 — clean baseline.
    )

    # Join the room — user can now hear and speak to the agent.
    await ctx.connect()

    logger.info("Session connected | room=%s", ctx.room.name)

    # Immediately greet the caller in Hindi/English to start the conversation
    session.generate_reply(
        instructions=(
            "Greet the shopkeeper warmly in Hindi, introduce yourself as ICCHA, "
            "and ask what the name of their shop is."
        )
    )


if __name__ == "__main__":
    cli.run_app(server)
