"""
ICCHA AI Voice Agent — Phase 3 (Structured Retail Interview & Profile Extraction).

Wires together STT → LLM → TTS with structured interview capabilities:
1. Google Places business lookup, candidate disambiguation, & review page setup
2. Dynamic shop type detection (retail vs services)
3. Incremental offering & pricing collection (products / services / vision extraction)
4. Operational hours & contact extraction
5. Real-time LiveKit DataChannel broadcasting to frontend for live website previews
6. Automatic generation of temporary preview website route (/temp/[slug])
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from livekit.agents import Agent, RunContext, function_tool, inference

from iccha.config import get_settings
from iccha.models import (
    BusinessCategory,
    BusinessHours,
    BusinessProfile,
    GooglePlaceCandidate,
    ProductItem,
)
from iccha.prompts import PHASE3_SYSTEM_PROMPT
from iccha.tools.places import lookup_google_places

logger = logging.getLogger(__name__)


class IcchaAgent(Agent):
    """
    ICCHA AI conversational voice agent for Indian retail shop owners and service providers.

    Maintains a live `BusinessProfile` state. As the merchant answers questions
    during the 5-step structured interview, tools update the profile and broadcast
    delta events over the LiveKit room's data channel.
    """

    def __init__(self) -> None:
        settings = get_settings()

        super().__init__(
            llm=inference.LLM(model="google/gemma-4-31b-it"),
            instructions=PHASE3_SYSTEM_PROMPT,
        )

        self.profile = BusinessProfile(
            shop_name="मेरी दुकान",
        )
        self.profile.ensure_temp_slug()

        logger.info(
            "IcchaAgent initialised | agent_name=%s | places_configured=%s",
            settings.agent_name,
            settings.google_places_configured,
        )

    async def _broadcast_profile(self, context: RunContext | None = None, room_override: Any = None) -> None:
        """Broadcast updated BusinessProfile over LiveKit room DataChannel."""
        room = room_override
        if not room and context and hasattr(context, "session"):
            session = getattr(context, "session", None)
            room = getattr(session, "room", None) if session else None

        if not room:
            return

        try:
            local_participant = getattr(room, "local_participant", None)
            if local_participant and hasattr(local_participant, "publish_data"):
                payload = self.profile.to_event_json().encode("utf-8")
                await local_participant.publish_data(payload, reliable=True)
                logger.info(
                    "Broadcast profile update over DataChannel | shop_name=%s | products=%d | verified=%s",
                    self.profile.shop_name,
                    len(self.profile.products),
                    self.profile.verified_via_places,
                )
        except Exception as e:
            logger.warning("Could not broadcast profile over DataChannel: %s", e)

    def _save_temp_site(self) -> None:
        """Save current profile as temporary site draft for /temp/[slug] route."""
        try:
            slug = self.profile.ensure_temp_slug()
            # Save to frontend/public/temp_sites/{slug}.json
            base_dir = Path(__file__).resolve().parent.parent.parent.parent
            target_dirs = [
                base_dir / "frontend" / "public" / "temp_sites",
                base_dir / "backend" / "src" / "data" / "temp_sites",
            ]
            for td in target_dirs:
                td.mkdir(parents=True, exist_ok=True)
                out_file = td / f"{slug}.json"
                out_file.write_text(self.profile.model_dump_json(indent=2), encoding="utf-8")
            logger.info("Saved temporary website draft to /temp_sites/%s.json", slug)
        except Exception as e:
            logger.warning("Failed to save temporary website draft: %s", e)

    # ── Phase 3 Tool: Business Lookup & Disambiguation ────────────────────────

    @function_tool
    async def lookup_business(
        self,
        context: RunContext,
        business_name: str,
        locality: str = "",
    ) -> str:
        """
        Look up a business on Google Places by name and locality.

        If a single match is found, pre-populates address and rating.
        If multiple matches are found, stores candidates for the user to choose.
        If not found, prepares the profile for Google review page setup.

        Args:
            business_name: The spoken name of the shop (e.g. 'गुप्ता जनरल स्टोर').
            locality: Locality, market, or city (e.g. 'Sector 18 Noida' or 'Lajpat Nagar').
        """
        self.profile.shop_name = business_name
        if locality:
            self.profile.locality = locality

        lookup = await lookup_google_places(business_name, locality)

        if lookup.status == "multiple_candidates" and lookup.candidates:
            self.profile.google_candidates = lookup.candidates
            self.profile.verified_via_places = False
            await self._broadcast_profile(context)

            options_text = "; ".join(
                f"विकल्प {i+1}: '{c.name}' situated at '{c.address}'"
                for i, c in enumerate(lookup.candidates)
            )
            return (
                f"Multiple matching shops found on Google Maps: {options_text}. "
                "Ask the user which of these options is their shop."
            )

        if lookup.status == "found_single":
            self.profile.verified_via_places = True
            self.profile.google_candidates = lookup.candidates
            if lookup.shop_name:
                self.profile.shop_name = lookup.shop_name
            if lookup.formatted_address:
                self.profile.address = lookup.formatted_address
            if lookup.rating:
                self.profile.rating = lookup.rating
            if lookup.user_rating_count:
                self.profile.total_reviews = lookup.user_rating_count
            if lookup.phone:
                self.profile.phone = lookup.phone
            if lookup.places_id:
                self.profile.places_id = lookup.places_id

            await self._broadcast_profile(context)
            return (
                f"Found on Google Places: '{self.profile.shop_name}' at '{self.profile.address}' "
                f"with {self.profile.rating}★ rating. Confirm this address with the user."
            )

        # Not found or unconfigured
        self.profile.verified_via_places = False
        self.profile.google_candidates = []
        await self._broadcast_profile(context)

        return (
            f"Shop '{business_name}' in '{locality}' not found on Google Maps. "
            "Reassure the merchant warmly and suggest setting up a Google Review / Business profile "
            "so new customers can find them online."
        )

    @function_tool
    async def select_google_place(
        self,
        context: RunContext,
        candidate_index: int,
    ) -> str:
        """
        Select a specific business from the Google Places candidates list (1-based index).

        Args:
            candidate_index: The choice number selected by the user (1, 2, or 3).
        """
        idx = candidate_index - 1
        if 0 <= idx < len(self.profile.google_candidates):
            chosen = self.profile.google_candidates[idx]
            self.profile.shop_name = chosen.name
            self.profile.address = chosen.address
            self.profile.rating = chosen.rating
            self.profile.total_reviews = chosen.user_ratings_total
            self.profile.places_id = chosen.place_id
            self.profile.verified_via_places = True
            # Clear other candidates now that one is chosen
            self.profile.google_candidates = [chosen]

            await self._broadcast_profile(context)
            return f"Selected option {candidate_index}: '{chosen.name}' at '{chosen.address}'."

        return f"Invalid candidate index {candidate_index}. Please choose from available options."

    @function_tool
    async def set_google_review_preference(
        self,
        context: RunContext,
        wants_help: bool,
    ) -> str:
        """
        Record whether the merchant wants help creating a Google Review / Business profile.

        Args:
            wants_help: True if they agreed to create a review page; False if they skipped.
        """
        self.profile.wants_google_review_help = wants_help
        await self._broadcast_profile(context)

        if wants_help:
            return "Merchant opted to create a Google Review & Business profile. Acknowledge enthusiastically."
        return "Merchant skipped Google Review profile creation. Proceed smoothly to products/services."

    # ── Phase 3 Tool: Business Type & Dynamic Offerings ───────────────────────

    @function_tool
    async def set_business_type(
        self,
        context: RunContext,
        business_type: str,
        category: str | None = None,
    ) -> str:
        """
        Set whether this business is retail, service, restaurant/cafe, or general.

        Args:
            business_type: One of 'retail', 'service', 'restaurant_cafe', 'general'.
            category: Optional specific category string (e.g. 'electronics', 'clothing').
        """
        b_type = business_type.lower()
        if b_type in ("retail", "service", "restaurant_cafe", "general"):
            self.profile.business_type = b_type  # type: ignore

        if category:
            try:
                self.profile.category = BusinessCategory(category.lower())
            except ValueError:
                self.profile.category = BusinessCategory.OTHER

        await self._broadcast_profile(context)
        return f"Business type set to '{self.profile.business_type}' ({self.profile.category.value})."

    @function_tool
    async def add_product(
        self,
        context: RunContext,
        name: str,
        price: float | None = None,
        unit: str | None = None,
        item_type: str = "product",
        description: str | None = None,
    ) -> str:
        """
        Add an individual product or service to the business catalog.

        Args:
            name: Name in Hindi or English (e.g. 'बासमती चावल' or 'स्क्रीन रिप्लेसमेंट').
            price: Price in Indian Rupees (₹), e.g. 350.0.
            unit: Unit of measurement (e.g. 'kg', 'packet', 'सर्विस', 'घंटा').
            item_type: Either 'product' or 'service'.
            description: Optional details or specialty.
        """
        itype = "service" if item_type.lower() == "service" else "product"
        item = ProductItem(
            name=name,
            price=price,
            unit=unit,
            item_type=itype,
            description=description,
        )
        self.profile.products.append(item)

        await self._broadcast_profile(context)

        unit_str = f" / {unit}" if unit else ""
        price_str = f" at ₹{price:.0f}{unit_str}" if price is not None else ""
        return f"Added {itype} '{name}'{price_str}. Total items in catalog: {len(self.profile.products)}."

    @function_tool
    async def add_offerings_batch(
        self,
        context: RunContext,
        items: list[dict[str, Any]],
    ) -> str:
        """
        Batch add multiple products or services (e.g. extracted from an image).

        Args:
            items: List of dictionaries with name, price, unit, item_type, description.
        """
        added_count = 0
        for it in items:
            if not isinstance(it, dict) or not it.get("name"):
                continue
            itype = "service" if str(it.get("item_type", "")).lower() == "service" else "product"
            self.profile.products.append(
                ProductItem(
                    name=str(it["name"]).strip(),
                    price=float(it["price"]) if it.get("price") is not None else None,
                    unit=str(it["unit"]).strip() if it.get("unit") else None,
                    item_type=itype,
                    description=str(it["description"]).strip() if it.get("description") else None,
                )
            )
            added_count += 1

        await self._broadcast_profile(context)
        return f"Added {added_count} items in batch. Total items in catalog: {len(self.profile.products)}."

    # ── Phase 3 Tool: Business Info & Timings Update ──────────────────────────

    @function_tool
    async def update_business_info(
        self,
        context: RunContext,
        category: str | None = None,
        owner_name: str | None = None,
        phone: str | None = None,
        open_time: str | None = None,
        close_time: str | None = None,
        closed_days: str | None = None,
        offers: str | None = None,
    ) -> str:
        """
        Update shop operational details, category, contact, or timings.

        Args:
            category: Business category (e.g. 'kirana', 'clothing', 'electronics', 'pharmacy', 'services').
            owner_name: Name of the merchant.
            phone: 10-digit contact / WhatsApp number.
            open_time: Opening time (e.g. '09:00 AM' or 'सुबह 9 बजे').
            close_time: Closing time (e.g. '09:00 PM' or 'रात 9 बजे').
            closed_days: Days closed (e.g. 'Sunday' or 'रविवार').
            offers: Highlights or deals (e.g. 'Free home delivery').
        """
        if category:
            try:
                self.profile.category = BusinessCategory(category.lower())
            except ValueError:
                self.profile.category = BusinessCategory.OTHER
        if owner_name:
            self.profile.owner_name = owner_name
        if phone:
            self.profile.phone = phone
            self.profile.whatsapp = phone

        if open_time or close_time or closed_days:
            if not self.profile.hours:
                self.profile.hours = BusinessHours()
            if open_time:
                self.profile.hours.open_time = open_time
            if close_time:
                self.profile.hours.close_time = close_time
            if closed_days:
                self.profile.hours.closed_days = [d.strip() for d in closed_days.split(",")]

        if offers:
            self.profile.offers = [o.strip() for o in offers.split(",") if o.strip()]

        await self._broadcast_profile(context)
        return "Business operational info and timings updated successfully."

    # ── Phase 3 Tool: Final Website Confirmation & Draft Route ────────────────

    @function_tool
    async def finalize_website(
        self,
        context: RunContext,
    ) -> str:
        """
        Mark the business profile interview as complete once the user confirms details.
        Generates the temporary preview website route (/temp/[slug]) and saves the draft.
        """
        self.profile.interview_complete = True
        slug = self.profile.ensure_temp_slug()
        self._save_temp_site()

        await self._broadcast_profile(context)

        return (
            f"Website profile for '{self.profile.shop_name}' is finalized with "
            f"{len(self.profile.products)} items! Draft website is hosted at '{self.profile.temp_url}'. "
            "Congratulate the merchant and encourage them to check the link on screen."
        )
