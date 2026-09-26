"""
ICCHA AI Voice Agent — Phase 3 (Structured Interview & Profile Extraction).

Wires together STT → LLM → TTS with structured interview capabilities:
1. Google Places business lookup & address pre-population
2. Incremental product & pricing extraction into BusinessProfile schema
3. Operational hours & contact extraction
4. Real-time LiveKit DataChannel broadcasting to frontend for live website previews
"""

from __future__ import annotations

import json
import logging

from livekit.agents import Agent, RunContext, function_tool, inference

from iccha.config import get_settings
from iccha.models import BusinessCategory, BusinessHours, BusinessProfile, ProductItem
from iccha.prompts import PHASE3_SYSTEM_PROMPT
from iccha.tools.places import lookup_google_places

logger = logging.getLogger(__name__)


class IcchaAgent(Agent):
    """
    ICCHA AI conversational voice agent for Indian retail shop owners.

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

        logger.info(
            "IcchaAgent initialised | agent_name=%s | places_configured=%s",
            settings.agent_name,
            settings.google_places_configured,
        )

    async def _broadcast_profile(self, context: RunContext | None = None) -> None:
        """Broadcast updated BusinessProfile over LiveKit room DataChannel."""
        if not context or not hasattr(context, "session"):
            return
        try:
            session = getattr(context, "session", None)
            room = getattr(session, "room", None) if session else None
            local_participant = getattr(room, "local_participant", None) if room else None

            if local_participant and hasattr(local_participant, "publish_data"):
                payload = self.profile.to_event_json().encode("utf-8")
                await local_participant.publish_data(payload, reliable=True)
                logger.info(
                    "Broadcast profile update over DataChannel | shop_name=%s | products=%d",
                    self.profile.shop_name,
                    len(self.profile.products),
                )
        except Exception as e:
            logger.warning("Could not broadcast profile over DataChannel: %s", e)

    # ── Phase 3 Tool: Business Lookup ─────────────────────────────────────────

    @function_tool
    async def lookup_business(
        self,
        context: RunContext,
        business_name: str,
        locality: str = "",
    ) -> str:
        """
        Look up a retail business on Google Places by name and locality.

        Pre-populates address, rating, and phone numbers if found.

        Args:
            business_name: The spoken name of the shop (e.g. 'गुप्ता जनरल स्टोर').
            locality: Locality, market, or city (e.g. 'Sector 18 Noida' or 'Lajpat Nagar').
        """
        self.profile.shop_name = business_name
        if locality:
            self.profile.locality = locality

        lookup = await lookup_google_places(business_name, locality)

        if lookup.found:
            self.profile.verified_via_places = True
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

        return json.dumps(lookup.to_dict(), ensure_ascii=False)

    # ── Phase 3 Tool: Product Catalog Collection ──────────────────────────────

    @function_tool
    async def add_product(
        self,
        context: RunContext,
        name: str,
        price: float | None = None,
        unit: str | None = None,
        description: str | None = None,
    ) -> str:
        """
        Add a product or service to the shop's featured catalog.

        Args:
            name: Product name in Hindi/English (e.g. 'बासमती चावल' or 'Ladies Suit').
            price: Price in Indian Rupees (₹), e.g. 350.0.
            unit: Unit of measurement, e.g. 'kg', 'packet', 'piece', 'meter'.
            description: Optional details, e.g. 'Premium quality 5kg bag'.
        """
        item = ProductItem(
            name=name,
            price=price,
            unit=unit,
            description=description,
        )
        self.profile.products.append(item)

        await self._broadcast_profile(context)

        unit_str = f" per {unit}" if unit else ""
        price_str = f" at ₹{price:.0f}{unit_str}" if price is not None else ""
        return f"Added '{name}'{price_str}. Total products in catalog: {len(self.profile.products)}."

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
            category: Business category (e.g. 'kirana', 'clothing', 'electronics', 'pharmacy').
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

    # ── Phase 3 Tool: Final Website Confirmation ─────────────────────────────

    @function_tool
    async def finalize_website(
        self,
        context: RunContext,
    ) -> str:
        """
        Mark the business profile interview as complete once the user confirms details.
        Triggers website generation ready state.
        """
        self.profile.interview_complete = True
        await self._broadcast_profile(context)

        return (
            f"Website profile for '{self.profile.shop_name}' is now finalized with "
            f"{len(self.profile.products)} products. Ready to publish!"
        )
