"""
Centralised settings for ICCHA AI backend.

All configuration is loaded from environment variables (or .env.local).
Nothing else in the codebase should import from dotenv or os.environ
directly — always go through `get_settings()`.

Design principles:
- Pydantic BaseSettings gives us type validation and clear error messages
  when a required variable is missing.
- `get_settings()` is cached via `@lru_cache` so env vars are parsed exactly
  once per process, not on every function call.
- Optional fields (Google Places, log level) have safe defaults so Phase 1
  runs without them configured.
"""

from __future__ import annotations

import logging
from functools import lru_cache

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    All runtime configuration for the ICCHA AI agent backend.

    Required variables (must be in .env.local or environment):
      LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET

    Optional variables (safe defaults provided):
      AGENT_NAME, LOG_LEVEL, GOOGLE_PLACES_API_KEY
    """

    model_config = SettingsConfigDict(
        # Load from .env.local first, then fall back to environment
        env_file=(".env.local", ".env"),
        env_file_encoding="utf-8",
        # Silently ignore extra env vars (don't raise on NEXT_PUBLIC_* etc.)
        extra="ignore",
        # Treat empty string env vars the same as unset (e.g. GOOGLE_PLACES_API_KEY=)
        env_ignore_empty=True,
    )

    # ── LiveKit connection (required) ─────────────────────────────────────
    livekit_url: str = Field(
        ...,
        description="WebSocket URL of the LiveKit SFU, e.g. wss://project.livekit.cloud",
    )
    livekit_api_key: str = Field(
        ...,
        description="LiveKit API key — used to authenticate the agent worker.",
    )
    livekit_api_secret: str = Field(
        ...,
        description="LiveKit API secret — used to sign access tokens.",
    )

    # ── Agent identity (optional, with defaults) ──────────────────────────
    agent_name: str = Field(
        default="iccha-agent",
        description=(
            "Routing key registered with LiveKit Cloud. "
            "The frontend token must request this agent name."
        ),
    )

    # ── Logging ──────────────────────────────────────────────────────────
    log_level: str = Field(
        default="INFO",
        description="Python logging level: DEBUG, INFO, WARNING, ERROR",
    )

    # ── External APIs (Phase 3 and beyond) ───────────────────────────────
    google_places_api_key: str | None = Field(
        default=None,
        description=(
            "Google Places API key for business lookup. "
            "Leave blank until Phase 3 — the agent will skip lookup gracefully."
        ),
    )

    # ── Phase 2 benchmark keys (all optional) ─────────────────────────────
    # Read directly from os.environ by the bench runner; declared here for
    # documentation and type-checked access. None = provider skipped.
    groq_api_key: str | None = Field(
        default=None,
        description="Groq API key — LLM benchmarking in Phase 2. Free at console.groq.com",
    )
    deepgram_api_key: str | None = Field(
        default=None,
        description="Deepgram API key — STT benchmarking in Phase 2. Free at console.deepgram.com",
    )
    smallest_ai_api_key: str | None = Field(
        default=None,
        validation_alias=AliasChoices("SMALLEST_AI_API_KEY", "SMALLEST_API_KEY"),
        description="Smallest.ai API key — TTS benchmarking in Phase 2.",
    )
    cartesia_api_key: str | None = Field(
        default=None,
        validation_alias=AliasChoices("CARTESIA_API_KEY"),
        description="Cartesia API key — real-time expressive TTS for Hindi/English.",
    )
    unsplash_access_key: str | None = Field(
        default=None,
        validation_alias=AliasChoices("UNSPLASH_ACCESS_KEY", "UNSPLASH_KEY"),
        description="Unsplash Access Key for real photography assets.",
    )

    # ── Validators ───────────────────────────────────────────────────────

    @field_validator("livekit_url")
    @classmethod
    def validate_livekit_url(cls, v: str) -> str:
        """Ensure the URL uses a WebSocket scheme."""
        if not v.startswith(("wss://", "ws://")):
            raise ValueError(f"LIVEKIT_URL must start with wss:// or ws://, got: {v!r}")
        return v.rstrip("/")

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """Ensure log level is a valid Python logging level name."""
        valid = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        upper = v.upper()
        if upper not in valid:
            raise ValueError(f"LOG_LEVEL must be one of {valid}, got: {v!r}")
        return upper

    @property
    def google_places_configured(self) -> bool:
        """True when Google Places API is available (Phase 3+)."""
        return bool(self.google_places_api_key)

    @property
    def unsplash_configured(self) -> bool:
        """True when Unsplash Access Key is available."""
        return bool(self.unsplash_access_key)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Return the singleton Settings instance.

    Cached after the first call so the .env file is parsed only once.
    In tests, call `get_settings.cache_clear()` before patching env vars.
    """
    settings = Settings()
    # Apply log level immediately when settings are first loaded
    logging.basicConfig(level=settings.log_level)
    return settings
