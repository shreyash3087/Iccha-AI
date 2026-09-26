"""
Smoke tests for IcchaAgent — in-process, no LiveKit Cloud connection required.

Validates the agent's structural properties, Phase 3 tools, and BusinessProfile state.
"""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from iccha.config import get_settings
from iccha.models import GooglePlaceCandidate
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
        assert agent.profile.temp_slug is not None
        assert agent.profile.temp_url.startswith("/temp/")


def test_iccha_agent_has_all_phase3_tools(valid_env):
    with patch("livekit.agents.inference.LLM") as mock_llm:
        mock_llm.return_value = MagicMock()
        from iccha.agent import IcchaAgent

        agent = IcchaAgent()
        assert hasattr(agent, "lookup_business")
        assert hasattr(agent, "select_google_place")
        assert hasattr(agent, "set_google_review_preference")
        assert hasattr(agent, "set_business_type")
        assert hasattr(agent, "add_product")
        assert hasattr(agent, "add_offerings_batch")
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
async def test_select_google_place_and_review_pref(valid_env):
    with patch("livekit.agents.inference.LLM") as mock_llm:
        mock_llm.return_value = MagicMock()
        from iccha.agent import IcchaAgent

        agent = IcchaAgent()
        mock_ctx = AsyncMock()

        # Seed candidates
        agent.profile.google_candidates = [
            GooglePlaceCandidate(
                place_id="p1",
                name="Gupta Mobile Repair",
                address="Shop 2, Sector 18, Noida",
                rating=4.7,
                user_ratings_total=40,
            ),
            GooglePlaceCandidate(
                place_id="p2",
                name="Gupta Electronics",
                address="Atta Market, Noida",
                rating=4.0,
                user_ratings_total=15,
            ),
        ]

        res = await agent.select_google_place(mock_ctx, candidate_index=1)
        assert "Selected option 1" in res
        assert agent.profile.shop_name == "Gupta Mobile Repair"
        assert agent.profile.address == "Shop 2, Sector 18, Noida"
        assert agent.profile.verified_via_places is True

        res_rev = await agent.set_google_review_preference(mock_ctx, wants_help=True)
        assert agent.profile.wants_google_review_help is True


@pytest.mark.asyncio
async def test_add_services_and_batch_and_finalize(valid_env):
    with patch("livekit.agents.inference.LLM") as mock_llm:
        mock_llm.return_value = MagicMock()
        from iccha.agent import IcchaAgent

        agent = IcchaAgent()
        mock_ctx = AsyncMock()

        # Set service business type
        await agent.set_business_type(mock_ctx, business_type="service", category="electronics")
        assert agent.profile.business_type == "service"

        # Add single service
        res1 = await agent.add_product(
            mock_ctx,
            name="स्क्रीन रिप्लेसमेंट",
            price=1200.0,
            unit="सर्विस",
            item_type="service",
        )
        assert "स्क्रीन रिप्लेसमेंट" in res1
        assert len(agent.profile.products) == 1
        assert agent.profile.products[0].item_type == "service"

        # Add batch offerings
        res_batch = await agent.add_offerings_batch(
            mock_ctx,
            items=[
                {"name": "बैटरी चेंज", "price": 650.0, "unit": "सर्विस", "item_type": "service"},
                {"name": "चार्जर", "price": 250.0, "unit": "पीस", "item_type": "product"},
            ],
        )
        assert "Added 2 items in batch" in res_batch
        assert len(agent.profile.products) == 3

        res_final = await agent.finalize_website(mock_ctx)
        assert agent.profile.interview_complete is True
        assert agent.profile.temp_url.startswith("/temp/")
        assert "finalized" in res_final.lower()
