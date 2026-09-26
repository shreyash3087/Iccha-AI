"""
Smoke tests for IcchaAgent — in-process, no LiveKit Cloud connection required.

Validates the agent's structural properties, Phase 3 tools, and BusinessProfile state.
"""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from iccha.config import get_settings
from iccha.prompts import PHASE1_SYSTEM_PROMPT, PHASE3_SYSTEM_PROMPT

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
    monkeypatch.delenv("GOOGLE_PLACES_API_KEY", raising=False)


# ── Prompt tests ──────────────────────────────────────────────────────────────


def test_prompts_are_not_empty():
    assert PHASE1_SYSTEM_PROMPT.strip()
    assert PHASE3_SYSTEM_PROMPT.strip()


def test_phase3_prompt_contains_interview_steps():
    assert "Step 1" in PHASE3_SYSTEM_PROMPT
    assert "Step 2" in PHASE3_SYSTEM_PROMPT
    assert "Step 3" in PHASE3_SYSTEM_PROMPT
    assert "Step 4" in PHASE3_SYSTEM_PROMPT
    assert "Step 5" in PHASE3_SYSTEM_PROMPT


def test_phase3_prompt_enforces_female_grammar():
    assert "कर सकती हूँ" in PHASE3_SYSTEM_PROMPT
    assert "करूँगी" in PHASE3_SYSTEM_PROMPT
    assert "बताऊँगी" in PHASE3_SYSTEM_PROMPT


# ── Agent instantiation & tools tests ─────────────────────────────────────────


def test_iccha_agent_instantiates(valid_env):
    with patch("livekit.agents.inference.LLM") as mock_llm:
        mock_llm.return_value = MagicMock()
        from iccha.agent import IcchaAgent

        agent = IcchaAgent()
        assert agent is not None
        assert agent.profile.shop_name == "मेरी दुकान"


def test_iccha_agent_has_all_phase3_tools(valid_env):
    with patch("livekit.agents.inference.LLM") as mock_llm:
        mock_llm.return_value = MagicMock()
        from iccha.agent import IcchaAgent

        agent = IcchaAgent()
        assert hasattr(agent, "lookup_business")
        assert hasattr(agent, "add_product")
        assert hasattr(agent, "update_business_info")
        assert hasattr(agent, "finalize_website")


@pytest.mark.asyncio
async def test_lookup_business_updates_profile(valid_env):
    with patch("livekit.agents.inference.LLM") as mock_llm:
        mock_llm.return_value = MagicMock()
        from iccha.agent import IcchaAgent

        agent = IcchaAgent()
        mock_ctx = AsyncMock()

        result = await agent.lookup_business(
            mock_ctx,
            business_name="Sharma General Store",
            locality="Lajpat Nagar, Delhi",
        )

        assert isinstance(result, str)
        assert agent.profile.shop_name == "Sharma General Store"
        assert agent.profile.locality == "Lajpat Nagar, Delhi"


@pytest.mark.asyncio
async def test_add_product_and_finalize(valid_env):
    with patch("livekit.agents.inference.LLM") as mock_llm:
        mock_llm.return_value = MagicMock()
        from iccha.agent import IcchaAgent

        agent = IcchaAgent()
        mock_ctx = AsyncMock()

        res1 = await agent.add_product(mock_ctx, name="चावल", price=60.0, unit="kg")
        assert "चावल" in res1
        assert len(agent.profile.products) == 1
        assert agent.profile.products[0].name == "चावल"
        assert agent.profile.products[0].price == 60.0

        res2 = await agent.update_business_info(
            mock_ctx,
            phone="9876543210",
            category="kirana",
            open_time="08:00 AM",
            close_time="10:00 PM",
            closed_days="Sunday",
        )
        assert "updated" in res2.lower()
        assert agent.profile.phone == "9876543210"
        assert agent.profile.hours.open_time == "08:00 AM"

        res3 = await agent.finalize_website(mock_ctx)
        assert agent.profile.interview_complete is True
        assert "finalized" in res3.lower()
