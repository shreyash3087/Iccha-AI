"""
ICCHA AI Voice Agent — Phase 1 (Hello World Pipeline).

This module defines IcchaAgent, the LiveKit Agent subclass that wires together
the STT → LLM → TTS pipeline with Silero VAD and MultilingualModel turn
detection. It is intentionally minimal in Phase 1: the goal is to validate the
entire pipeline end-to-end and measure baseline latency before any business
logic is added.

Pipeline (Phase 1):
  STT  : AssemblyAI Universal-3.5 Pro (language=hi, via LiveKit Inference)
  LLM  : google/gemma-4-31b-it (via LiveKit Inference)
  TTS  : fishaudio/s2.1-pro (via LiveKit Inference)
  VAD  : Silero (auto-supplied by AgentSession)
  Turn : MultilingualModel (99.4% TPR on Hindi, per PLAN.md §3)

Phase 2 will benchmark these providers against Deepgram, Groq, and Smallest.ai
using real Hindi audio before locking final choices.

Noise cancellation (ai_coustics) is intentionally excluded in Phase 1 to give
a clean, unmodified latency baseline. It will be evaluated in Phase 6 tuning.
"""

from __future__ import annotations

import logging

from livekit.agents import Agent, RunContext, function_tool, inference

from iccha.config import get_settings
from iccha.prompts import PHASE1_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class IcchaAgent(Agent):
    """
    ICCHA AI voice agent for Indian retail shop owners.

    Phase 1 capability: bilingual conversation (Hindi + English) with
    MultilingualModel turn detection. No business extraction or website
    generation yet — those are Phase 3.

    The Agent base class receives instructions (system prompt) and an LLM.
    STT, TTS, and turn handling are wired in AgentSession (server.py) to
    keep the Agent class focused purely on behaviour.
    """

    def __init__(self) -> None:
        settings = get_settings()

        super().__init__(
            # ── LLM: Gemma 4 31B via LiveKit Inference ───────────────────
            # Phase 2 will benchmark Groq Llama 3.3 70B and Cerebras against
            # this baseline. Groq/Cerebras claim 100-200ms TTFT vs ~400-700ms
            # for standard GPU-hosted inference; we need real measurements.
            llm=inference.LLM(model="google/gemma-4-31b-it"),
            instructions=PHASE1_SYSTEM_PROMPT,
        )

        logger.info(
            "IcchaAgent initialised | agent_name=%s | places_configured=%s",
            settings.agent_name,
            settings.google_places_configured,
        )

    # ── Tool stubs (wired in Phase 3) ─────────────────────────────────────
    #
    # Declaring the stub here establishes the interface and ensures the test
    # suite can assert that it exists. Phase 3 will replace the body with the
    # real Google Places API call and a hold-message (cached TTS) pattern so
    # the Places lookup latency is invisible to the user.

    @function_tool
    async def lookup_business(
        self,
        context: RunContext,
        business_name: str,
        locality: str,
    ) -> str:
        """
        Look up a retail business on Google Places by name and locality.

        Returns a JSON string with available details (name, address, phone,
        hours, rating, reviews). Returns a stub message in Phase 1.

        Args:
            business_name: The spoken name of the shop, as heard by STT.
            locality: City, area, or neighbourhood (e.g. "Lajpat Nagar, Delhi").
        """
        settings = get_settings()

        if not settings.google_places_configured:
            logger.debug(
                "lookup_business called but GOOGLE_PLACES_API_KEY not set — "
                "returning stub. (Expected in Phase 1.)"
            )
            # Return a friendly stub so the LLM can continue the conversation.
            return (
                f"Business lookup is not yet configured. "
                f"I heard the shop name as '{business_name}' "
                f"in '{locality}'. Please confirm these details with the user."
            )

        # TODO Phase 3: implement real Google Places Text Search
        # Pattern:
        #   1. Play a cached hold-message TTS clip ("ek second, main dhundh raha hoon")
        #   2. Async HTTP call to Places API
        #   3. Return structured JSON
        #   4. Agent reads back key fields for user confirmation
        raise NotImplementedError(
            "Google Places lookup will be implemented in Phase 3."
        )
