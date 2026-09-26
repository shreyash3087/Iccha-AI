"""
Smoke tests for IcchaAgent — in-process, no LiveKit Cloud connection required.

These tests validate the agent's structural properties and stub behaviour
without making any network calls. They run fast (< 1 second) and are safe
to run in CI with no external credentials.

For full conversation-level evaluation (turn quality, Hindi accuracy,
latency), see the Phase 2 benchmarking plan in PLAN.md §5.

What we test here:
  1. IcchaAgent can be instantiated with valid env vars.
  2. The lookup_business tool exists and is callable.
  3. The stub returns a graceful message when Places API is not configured.
  4. The system prompt is non-empty and contains key persona markers.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from iccha.config import get_settings
from iccha.prompts import PHASE1_SYSTEM_PROMPT

# ── Fixtures ──────────────────────────────────────────────────────────────────

VALID_ENV = {
    "LIVEKIT_URL": "wss://test.livekit.cloud",
    "LIVEKIT_API_KEY": "test-key",
    "LIVEKIT_API_SECRET": "test-secret",
}


@pytest.fixture(autouse=True)
def clear_settings_cache():
    """Clear lru_cache before and after every test."""
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def valid_env(monkeypatch):
    """Set valid LiveKit env vars for tests that need Settings to load."""
    for k, v in VALID_ENV.items():
        monkeypatch.setenv(k, v)
    # Ensure no Places key leaks in from a real .env.local
    monkeypatch.delenv("GOOGLE_PLACES_API_KEY", raising=False)


# ── Prompt tests ──────────────────────────────────────────────────────────────


def test_phase1_prompt_is_not_empty():
    """PHASE1_SYSTEM_PROMPT must not be empty — it drives all agent behaviour."""
    assert PHASE1_SYSTEM_PROMPT.strip(), "PHASE1_SYSTEM_PROMPT is empty"


def test_phase1_prompt_contains_hindi_instruction():
    """Prompt must instruct the agent to respond in Hindi when spoken to."""
    assert "Hindi" in PHASE1_SYSTEM_PROMPT or "hindi" in PHASE1_SYSTEM_PROMPT.lower()


def test_phase1_prompt_contains_iccha_name():
    """Agent persona must be named ICCHA."""
    assert "ICCHA" in PHASE1_SYSTEM_PROMPT


def test_phase1_prompt_forbids_markdown():
    """Voice TTS rules must prohibit markdown output."""
    assert "markdown" in PHASE1_SYSTEM_PROMPT.lower()


# ── Agent instantiation tests ─────────────────────────────────────────────────


def test_iccha_agent_instantiates(valid_env):
    """IcchaAgent can be constructed without raising."""
    # Patch the inference.LLM call — we are not testing LiveKit connectivity.
    with patch("livekit.agents.inference.LLM") as mock_llm:
        mock_llm.return_value = MagicMock()
        from iccha.agent import IcchaAgent

        agent = IcchaAgent()
        assert agent is not None


def test_iccha_agent_has_lookup_business_tool(valid_env):
    """IcchaAgent must expose a lookup_business function tool for Phase 3."""
    with patch("livekit.agents.inference.LLM") as mock_llm:
        mock_llm.return_value = MagicMock()
        from iccha.agent import IcchaAgent

        agent = IcchaAgent()
        # The tool is registered via @function_tool decorator.
        # It should be accessible as an attribute on the agent instance.
        assert hasattr(agent, "lookup_business"), (
            "IcchaAgent must have a lookup_business tool "
            "(declared now, implemented in Phase 3)"
        )


# ── Tool stub tests ───────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_lookup_business_stub_returns_gracefully(valid_env):
    """
    When GOOGLE_PLACES_API_KEY is not configured, lookup_business must
    return a helpful stub string rather than raising an exception.

    This is critical: if the tool crashed, the LLM would receive an error
    and likely generate a confusing response to the user.
    """
    with patch("livekit.agents.inference.LLM") as mock_llm:
        mock_llm.return_value = MagicMock()
        from iccha.agent import IcchaAgent

        agent = IcchaAgent()

        # Provide a mock RunContext (not used in the stub)
        mock_ctx = AsyncMock()

        result = await agent.lookup_business(
            mock_ctx,
            business_name="Sharma General Store",
            locality="Lajpat Nagar, Delhi",
        )

        assert isinstance(result, str), "Stub must return a string"
        assert len(result) > 0, "Stub must return a non-empty string"
        assert "Sharma General Store" in result, (
            "Stub should echo the business name back for LLM context"
        )


@pytest.mark.asyncio
async def test_lookup_business_raises_when_places_configured(monkeypatch):
    """
    When GOOGLE_PLACES_API_KEY is set but Phase 3 implementation is missing,
    lookup_business must raise NotImplementedError (not silently do nothing).
    """
    for k, v in VALID_ENV.items():
        monkeypatch.setenv(k, v)
    monkeypatch.setenv("GOOGLE_PLACES_API_KEY", "AIza-test")

    with patch("livekit.agents.inference.LLM") as mock_llm:
        mock_llm.return_value = MagicMock()
        from iccha.agent import IcchaAgent

        agent = IcchaAgent()
        mock_ctx = AsyncMock()

        with pytest.raises(NotImplementedError, match="Phase 3"):
            await agent.lookup_business(
                mock_ctx,
                business_name="Test Shop",
                locality="Mumbai",
            )
