"""
Tests for iccha.config — Settings loading and validation.

These are pure unit tests: no LiveKit connection, no network calls.
They validate that our Pydantic Settings model:
  - Loads correctly from environment variables.
  - Raises clear ValidationError messages when required fields are missing.
  - Rejects invalid values (bad URL scheme, invalid log level).
  - Correctly reports google_places_configured state.

Testing approach:
  We use monkeypatch to set environment variables in the test process.
  After each test, get_settings.cache_clear() ensures the lru_cache
  does not bleed state between tests.
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from iccha.config import Settings, get_settings

# ── Fixtures ──────────────────────────────────────────────────────────────────

VALID_ENV = {
    "LIVEKIT_URL": "wss://test.livekit.cloud",
    "LIVEKIT_API_KEY": "test-key",
    "LIVEKIT_API_SECRET": "test-secret",
}


@pytest.fixture(autouse=True)
def clear_settings_cache():
    """Clear the lru_cache before and after every test."""
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


# ── Happy-path tests ──────────────────────────────────────────────────────────


def test_settings_loads_required_fields(monkeypatch):
    """Settings loads correctly when all required env vars are present."""
    for k, v in VALID_ENV.items():
        monkeypatch.setenv(k, v)

    settings = Settings()

    assert settings.livekit_url == "wss://test.livekit.cloud"
    assert settings.livekit_api_key == "test-key"
    assert settings.livekit_api_secret == "test-secret"


def test_default_agent_name(monkeypatch):
    """Agent name defaults to 'iccha-agent' when not set."""
    for k, v in VALID_ENV.items():
        monkeypatch.setenv(k, v)

    settings = Settings()

    assert settings.agent_name == "iccha-agent"


def test_custom_agent_name(monkeypatch):
    """Agent name can be overridden via AGENT_NAME env var."""
    for k, v in VALID_ENV.items():
        monkeypatch.setenv(k, v)
    monkeypatch.setenv("AGENT_NAME", "iccha-v2")

    settings = Settings()

    assert settings.agent_name == "iccha-v2"


def test_default_log_level(monkeypatch):
    """Log level defaults to INFO."""
    for k, v in VALID_ENV.items():
        monkeypatch.setenv(k, v)

    settings = Settings()

    assert settings.log_level == "INFO"


def test_log_level_normalised_to_uppercase(monkeypatch):
    """Log level input is case-insensitive and stored as uppercase."""
    for k, v in VALID_ENV.items():
        monkeypatch.setenv(k, v)
    monkeypatch.setenv("LOG_LEVEL", "debug")

    settings = Settings()

    assert settings.log_level == "DEBUG"


def test_google_places_not_configured_by_default(monkeypatch):
    """google_places_configured is False when key is not set."""
    for k, v in VALID_ENV.items():
        monkeypatch.setenv(k, v)
    monkeypatch.delenv("GOOGLE_PLACES_API_KEY", raising=False)

    # _env_file=None bypasses .env.local so we only see monkeypatched vars
    settings = Settings(_env_file=None)

    assert settings.google_places_configured is False
    assert settings.google_places_api_key is None


def test_google_places_configured_when_key_present(monkeypatch):
    """google_places_configured is True when API key is set."""
    for k, v in VALID_ENV.items():
        monkeypatch.setenv(k, v)
    monkeypatch.setenv("GOOGLE_PLACES_API_KEY", "AIza-test-key")

    settings = Settings()

    assert settings.google_places_configured is True


def test_trailing_slash_stripped_from_url(monkeypatch):
    """Trailing slashes are stripped from LIVEKIT_URL for consistency."""
    for k, v in VALID_ENV.items():
        monkeypatch.setenv(k, v)
    monkeypatch.setenv("LIVEKIT_URL", "wss://test.livekit.cloud/")

    settings = Settings()

    assert not settings.livekit_url.endswith("/")


# ── Validation failure tests ──────────────────────────────────────────────────


def test_missing_livekit_url_raises(monkeypatch):
    """ValidationError raised when LIVEKIT_URL is not set."""
    monkeypatch.setenv("LIVEKIT_API_KEY", "k")
    monkeypatch.setenv("LIVEKIT_API_SECRET", "s")
    # Explicitly remove URL so we test the missing-required-field path
    monkeypatch.delenv("LIVEKIT_URL", raising=False)

    # _env_file=None ensures .env.local on disk does NOT provide the value
    with pytest.raises(ValidationError, match="livekit_url"):
        Settings(_env_file=None)


def test_missing_api_key_raises(monkeypatch):
    """ValidationError raised when LIVEKIT_API_KEY is not set."""
    monkeypatch.setenv("LIVEKIT_URL", "wss://test.livekit.cloud")
    monkeypatch.setenv("LIVEKIT_API_SECRET", "s")
    monkeypatch.delenv("LIVEKIT_API_KEY", raising=False)

    with pytest.raises(ValidationError, match="livekit_api_key"):
        Settings(_env_file=None)


def test_missing_api_secret_raises(monkeypatch):
    """ValidationError raised when LIVEKIT_API_SECRET is not set."""
    monkeypatch.setenv("LIVEKIT_URL", "wss://test.livekit.cloud")
    monkeypatch.setenv("LIVEKIT_API_KEY", "k")
    monkeypatch.delenv("LIVEKIT_API_SECRET", raising=False)

    with pytest.raises(ValidationError, match="livekit_api_secret"):
        Settings(_env_file=None)


def test_invalid_url_scheme_raises(monkeypatch):
    """ValidationError raised when LIVEKIT_URL uses http:// instead of wss://."""
    for k, v in VALID_ENV.items():
        monkeypatch.setenv(k, v)
    monkeypatch.setenv("LIVEKIT_URL", "https://wrong-scheme.livekit.cloud")

    with pytest.raises(ValidationError, match="wss://"):
        Settings()


def test_invalid_log_level_raises(monkeypatch):
    """ValidationError raised when LOG_LEVEL is not a valid Python level."""
    for k, v in VALID_ENV.items():
        monkeypatch.setenv(k, v)
    monkeypatch.setenv("LOG_LEVEL", "VERBOSE")

    with pytest.raises(ValidationError, match="LOG_LEVEL"):
        Settings()
