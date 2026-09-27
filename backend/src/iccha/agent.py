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
    BannerItem,
    BusinessCategory,
    BusinessHours,
    BusinessProfile,
    FAQItem,
    GalleryItem,
    GooglePlaceCandidate,
    HighlightItem,
    ProductItem,
    ReviewItem,
    SiteSection,
    SiteSectionData,
    StorySectionData,
)
from iccha.prompts import PHASE3_SYSTEM_PROMPT, get_language_prompt
from iccha.tools.places import fetch_place_reviews, lookup_google_places
from iccha.tools.unsplash import (
    fetch_gallery_photos,
    fetch_hero_cover,
    fetch_product_image,
    search_unsplash_photos,
)

logger = logging.getLogger(__name__)


class IcchaAgent(Agent):
    """
    ICCHA AI conversational voice agent for Indian retail shop owners and service providers.

    Maintains a live `BusinessProfile` state. As the merchant answers questions
    during the 5-step structured interview, tools update the profile and broadcast
    delta events over the LiveKit room's data channel.
    """

    def __init__(
        self,
        language: str = "hi-en",
        profile: BusinessProfile | None = None,
        is_edit_mode: bool = False,
    ) -> None:
        settings = get_settings()
        self.language = language
        self.profile = profile or BusinessProfile(
            shop_name="मेरी दुकान",
        )
        self.profile.ensure_temp_slug()
        self._room: Any = None

        if not is_edit_mode:
            is_edit_mode = bool(
                self.profile
                and (
                    self.profile.interview_complete
                    or (self.profile.shop_name and self.profile.shop_name != "मेरी दुकान")
                )
            )
        self.is_edit_mode = is_edit_mode

        super().__init__(
            llm=inference.LLM(model="google/gemma-4-31b-it"),
            instructions=get_language_prompt(language, is_edit_mode=is_edit_mode),
        )

        logger.info(
            "IcchaAgent initialised | agent_name=%s | places_configured=%s | is_edit_mode=%s",
            settings.agent_name,
            settings.google_places_configured,
            self.is_edit_mode,
        )

    async def _broadcast_profile(self, context: RunContext | None = None, room_override: Any = None) -> None:
        """Broadcast updated BusinessProfile over LiveKit room DataChannel."""
        if room_override:
            self._room = room_override

        room = self._room
        if not room and context:
            session = getattr(context, "session", None)
            if session:
                room = getattr(session, "room", None)
                if not room and hasattr(session, "room_io"):
                    room = getattr(session.room_io, "room", None)
                if not room and hasattr(session, "_room"):
                    room = getattr(session, "_room", None)
            if room:
                self._room = room

        if not room:
            logger.warning("No room available to broadcast profile update over DataChannel")
            return

        try:
            self._save_temp_site()
            local_participant = getattr(room, "local_participant", None)
            if local_participant and hasattr(local_participant, "publish_data"):
                payload = self.profile.to_event_json().encode("utf-8")
                await local_participant.publish_data(payload, reliable=True)
                logger.info(
                    "Broadcast profile update over DataChannel | shop_name=%s | candidates=%d | products=%d | verified=%s",
                    self.profile.shop_name,
                    len(self.profile.google_candidates),
                    len(self.profile.products),
                    self.profile.verified_via_places,
                )
        except Exception as e:
            logger.warning("Could not broadcast profile over DataChannel: %s", e)

    def _save_temp_site(self) -> None:
        """Save current profile as temporary site draft for /temp/[slug] route."""
        # Never overwrite a real storefront with default dummy profile
        if not self.profile or self.profile.shop_name == "मेरी दुकान":
            return

        try:
            slug = self.profile.ensure_temp_slug()
            base_dir = Path(__file__).resolve().parent.parent.parent.parent
            target_dirs = [
                base_dir / "backend" / "src" / "data" / "temp_sites",
                base_dir / "frontend" / "public" / "temp_sites",
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
        self.profile.update_temp_slug(force=True)
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
            if lookup.reviews:
                self.profile.ensure_default_sections()
                rev_sec = next((s for s in self.profile.sections if s.type == "reviews"), None)
                if rev_sec:
                    rev_sec.data.reviews = [ReviewItem(**r) for r in lookup.reviews]

            if self.profile.sections:
                for s in self.profile.sections:
                    if s.type == "hero":
                        s.title = self.profile.shop_name

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
            self.profile.update_temp_slug(force=True)
            self.profile.address = chosen.address
            self.profile.rating = chosen.rating
            self.profile.total_reviews = chosen.user_ratings_total
            self.profile.places_id = chosen.place_id
            self.profile.verified_via_places = True
            # Clear other candidates now that one is chosen
            self.profile.google_candidates = [chosen]

            if chosen.place_id:
                try:
                    google_revs = await fetch_place_reviews(chosen.place_id)
                    if google_revs:
                        self.profile.ensure_default_sections()
                        rev_sec = next((s for s in self.profile.sections if s.type == "reviews"), None)
                        if rev_sec:
                            rev_sec.data.reviews = [ReviewItem(**r) for r in google_revs]
                except Exception as e:
                    logger.warning("Could not auto-fetch reviews for selected place: %s", e)

            if self.profile.sections:
                for s in self.profile.sections:
                    if s.type == "hero":
                        s.title = self.profile.shop_name

            self._save_temp_site()

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
        template_id: str | None = None,
    ) -> str:
        """
        Set the business category and optionally choose a storefront template design.

        Args:
            business_type: Legacy compatibility param — pass the main type like 'product', 'service', 'other'.
            category: Business category — one of 'product', 'service', or 'other'.
                      'product' = shops that sell goods (kirana, grocery, clothing, hardware, sweets, etc.)
                      'service' = shops that offer services (salon, repair, tailor, clinic, etc.)
                      'other'   = mixed or general businesses.
            template_id: Design template to use for the storefront. Choose the best fit:
                         - product → 'product-classic', 'product-bold', 'product-minimal', 'product-warm', 'product-fresh'
                         - service → 'service-elegant', 'service-modern', 'service-warm', 'service-bold', 'service-clean'
                         - other   → 'other-simple', 'other-grid', 'other-card', 'other-minimal', 'other-flex'
        """
        bt = (business_type or "").lower().strip()
        cat = (category or "").lower().strip()

        if bt in ("service", "services") or cat in ("service", "services"):
            self.profile.category = BusinessCategory.SERVICE
        elif bt in ("product", "retail", "goods") or cat in ("product", "retail", "kirana"):
            self.profile.category = BusinessCategory.PRODUCT
        elif bt == "other" or cat == "other":
            self.profile.category = BusinessCategory.OTHER
        else:
            try:
                self.profile.category = BusinessCategory(cat or bt)
            except ValueError:
                self.profile.category = BusinessCategory.OTHER

        if template_id:
            self.profile.template_id = template_id

        await self._broadcast_profile(context)
        tid = f" · template: {self.profile.template_id}" if self.profile.template_id else ""
        return f"Category set to '{self.profile.category.value}'{tid}."


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
        shop_name: str | None = None,
        tagline: str | None = None,
        address: str | None = None,
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
            shop_name: Optional updated shop name.
            tagline: Optional business slogan or tagline.
            address: Optional updated street address or locality.
            category: Business category (e.g. 'product', 'service', 'other').
            owner_name: Name of the merchant.
            phone: 10-digit contact / WhatsApp number.
            open_time: Opening time (e.g. '09:00 AM' or 'सुबह 9 बजे').
            close_time: Closing time (e.g. '09:00 PM' or 'रात 9 बजे').
            closed_days: Days closed (e.g. 'Sunday' or 'रविवार').
            offers: Highlights or deals (e.g. 'Free home delivery').
        """
        if shop_name:
            self.profile.shop_name = shop_name.strip()
        if tagline:
            self.profile.tagline = tagline.strip()
            if self.profile.sections:
                for sec in self.profile.sections:
                    if sec.type == "hero":
                        sec.subtitle = self.profile.tagline
        if address:
            self.profile.address = address.strip()

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
        return "Business operational info and details updated successfully."

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
        self.profile.update_temp_slug(force=True)
        slug = self.profile.ensure_temp_slug()
        self._save_temp_site()

        await self._broadcast_profile(context)

        return (
            f"Website profile for '{self.profile.shop_name}' is finalized with "
            f"{len(self.profile.products)} items! Draft website is hosted at '{self.profile.temp_url}'. "
            "Congratulate the merchant and encourage them to check the link on screen."
        )

    # ── Live Editing Tools: Real-time Storefront Customization ────────────────

    @function_tool
    async def update_storefront_style(
        self,
        context: RunContext,
        primary_color: str | None = None,
        accent_color: str | None = None,
        template_id: str | None = None,
    ) -> str:
        """
        Update the visual style, color theme, or template design of the website storefront.

        Args:
            primary_color: Main theme/brand color (e.g. 'maroon', '#800000', 'navy', '#1e3a8a', 'green', '#15803d', 'gold', '#d97706').
            accent_color: Accent or secondary highlight color.
            template_id: Choice of storefront layout template:
                         - product: 'product-classic', 'product-bold', 'product-minimal', 'product-warm', 'product-fresh'
                         - service: 'service-elegant', 'service-modern', 'service-warm', 'service-bold', 'service-clean'
                         - other: 'other-simple', 'other-grid', 'other-card', 'other-minimal', 'other-flex'
        """
        color_map = {
            "maroon": "#800000",
            "मैरून": "#800000",
            "कत्थई": "#800000",
            "red": "#dc2626",
            "लाल": "#dc2626",
            "crimson": "#be123c",
            "burgundy": "#701a75",
            "navy": "#1e3a8a",
            "navy blue": "#1e3a8a",
            "नेवी ब्लू": "#1e3a8a",
            "blue": "#2563eb",
            "नीला": "#2563eb",
            "royal blue": "#1d4ed8",
            "green": "#15803d",
            "हरा": "#15803d",
            "dark green": "#14532d",
            "emerald": "#065f46",
            "yellow": "#eab308",
            "पीला": "#eab308",
            "gold": "#d97706",
            "golden": "#d97706",
            "सुनहरा": "#d97706",
            "orange": "#ea580c",
            "नारंगी": "#ea580c",
            "saffron": "#ff9933",
            "भगवा": "#ff9933",
            "purple": "#7c3aed",
            "बैंगनी": "#7c3aed",
            "violet": "#8b5cf6",
            "pink": "#db2777",
            "गुलाबी": "#db2777",
            "magenta": "#e879f9",
            "teal": "#0d9488",
            "cyan": "#06b6d4",
            "black": "#18181b",
            "काला": "#18181b",
            "dark": "#18181b",
            "brown": "#78350f",
            "भूरा": "#78350f",
            "coffee": "#451a03",
        }
        if primary_color:
            cleaned_color = primary_color.strip().lower()
            self.profile.primary_color = color_map.get(cleaned_color, primary_color.strip())

        if accent_color:
            cleaned_accent = accent_color.strip().lower()
            self.profile.accent_color = color_map.get(cleaned_accent, accent_color.strip())

        # Smart template normalization
        if template_id:
            raw_t = template_id.strip().lower()
            valid_templates = {
                "product-classic", "product-bold", "product-minimal", "product-warm", "product-fresh",
                "service-elegant", "service-modern", "service-warm", "service-bold", "service-clean",
                "other-simple", "other-grid", "other-card", "other-minimal", "other-flex",
            }
            if raw_t in valid_templates:
                self.profile.template_id = raw_t
            else:
                cat = str(self.profile.category.value if hasattr(self.profile.category, "value") else self.profile.category).lower()
                prefix = "service" if cat == "service" else "other" if cat == "other" else "product"
                matched = None
                for vt in valid_templates:
                    if vt.startswith(prefix) and raw_t in vt:
                        matched = vt
                        break
                if not matched:
                    for vt in valid_templates:
                        if raw_t in vt:
                            matched = vt
                            break
                if matched:
                    self.profile.template_id = matched

        await self._broadcast_profile(context)
        return (
            f"Storefront style updated: primary_color={self.profile.primary_color}, "
            f"template_id={self.profile.template_id}."
        )


    @function_tool
    async def remove_product(
        self,
        context: RunContext,
        product_name: str,
    ) -> str:
        """
        Remove a product or service from the business catalog.

        Args:
            product_name: Name of the item to remove (e.g. 'Steam Rice' or 'बासमती चावल').
        """
        target = product_name.strip().lower()
        original_count = len(self.profile.products)
        self.profile.products = [
            p for p in self.profile.products
            if target not in p.name.lower() and p.name.lower() not in target
        ]
        removed_count = original_count - len(self.profile.products)

        await self._broadcast_profile(context)

        if removed_count > 0:
            return f"Removed '{product_name}' from the catalog. Remaining items: {len(self.profile.products)}."
        return f"Item '{product_name}' was not found in catalog."

    @function_tool
    async def update_product_price(
        self,
        context: RunContext,
        product_name: str,
        new_price: float,
        new_unit: str | None = None,
    ) -> str:
        """
        Update the price or unit of an existing product or service.

        Args:
            product_name: Name of the existing item (e.g. 'Veg Biryani').
            new_price: New price in Indian Rupees (₹).
            new_unit: Optional updated unit (e.g. 'plate', 'kg').
        """
        target = product_name.strip().lower()
        matched = False
        for p in self.profile.products:
            if target in p.name.lower() or p.name.lower() in target:
                p.price = new_price
                if new_unit:
                    p.unit = new_unit
                matched = True
                break

        await self._broadcast_profile(context)

        if matched:
            return f"Updated price of '{product_name}' to ₹{new_price:.0f}."
        return f"Could not find item '{product_name}' to update price."

    # ── Spec-Driven Modular Sections & Visual Customization Tools ────────────

    @function_tool
    async def add_section(
        self,
        context: RunContext,
        section_type: str,
        title: str | None = None,
        subtitle: str | None = None,
    ) -> str:
        """
        Add a new modular section to the storefront website (e.g. reviews, gallery, story, highlights, faq, offers).

        Args:
            section_type: Type of section to add:
                          - 'reviews': Customer testimonials / Google reviews
                          - 'gallery': High-resolution food/ambiance photo showcase
                          - 'story': 'About Us / हमारी कहानी' heritage story
                          - 'highlights': Trust badges (100% Shuddh, Fast Delivery, Google Verified)
                          - 'offers': Special discount or announcement banner
                          - 'faq': Frequently asked questions and answers
                          - 'contact': Store hours and location details
            title: Optional custom section heading (in Hindi or English).
            subtitle: Optional custom section subtitle.
        """
        s_type = section_type.strip().lower()
        self.profile.ensure_default_sections()

        # Check if section already exists
        existing = next((s for s in self.profile.sections if s.type == s_type), None)
        if existing:
            existing.enabled = True
            if title:
                existing.title = title
            if subtitle:
                existing.subtitle = subtitle
            await self._broadcast_profile(context)
            return f"Section '{s_type}' is already present and has been refreshed."

        new_sec_data = SiteSectionData()

        if s_type in ("reviews", "review", "testimonial", "testimonials"):
            s_type = "reviews"
            t = title or "ग्राहक समीक्षाएं (Google Reviews)"
            sub = subtitle or f"{self.profile.rating or 4.8}★ रेटिंग • {self.profile.total_reviews or 140}+ खुशहाल ग्राहकों का भरोसा"
            google_reviews = []
            if self.profile.places_id:
                try:
                    google_reviews = await fetch_place_reviews(self.profile.places_id)
                except Exception as e:
                    logger.warning("Could not fetch place reviews from Google Places API: %s", e)

            if google_reviews:
                new_sec_data.reviews = [ReviewItem(**r) for r in google_reviews]
            else:
                new_sec_data.reviews = [
                    ReviewItem(
                        author_name="अमित कुमार (Amit Kumar)",
                        rating=5,
                        text=f"{self.profile.shop_name} का स्वाद और सर्विस वाकई लाजवाब है! यहां की क्वालिटी बहुत बढ़िया है।",
                        relative_time="2 दिन पहले",
                        verified=True,
                    ),
                    ReviewItem(
                        author_name="पूजा शर्मा (Pooja Sharma)",
                        rating=5,
                        text="बहुत ही साफ़-सुथरा और शुद्ध माहौल। डिलीवरी भी बहुत फ़ास्ट मिली। 5 स्टार रेटिंग!",
                        relative_time="1 हफ़्ते पहले",
                        verified=True,
                    ),
                    ReviewItem(
                        author_name="रोहित वर्मा (Rohit Verma)",
                        rating=5,
                        text="किफ़ायती दाम और बेहतरीन टेस्ट। हमारे पूरे परिवार का पसंदीदा स्थान है।",
                        relative_time="2 हफ़्ते पहले",
                        verified=True,
                    ),
                ]

        elif s_type in ("gallery", "photos", "photo", "images"):
            s_type = "gallery"
            t = title or "फ़ोटो गैलरी (Photo Gallery)"
            sub = subtitle or "हमारे स्वादिष्ट व्यंजन और रेस्टोरेंट की झलक"
            photos = await fetch_gallery_photos(self.profile.shop_name, count=6)
            new_sec_data.gallery = [GalleryItem(**p) for p in photos]

        elif s_type in ("story", "about", "about_us", "history"):
            s_type = "story"
            t = title or "हमारी कहानी (Our Story)"
            sub = subtitle or "स्वाद, परंपरा और ईमानदारी का अटूट विश्वास"
            hero_img = await fetch_hero_cover(self.profile.shop_name, category="restaurant")
            new_sec_data.story = StorySectionData(
                heading=f"Welcome to {self.profile.shop_name}",
                content=f"{self.profile.shop_name} में हम सिर्फ खाना नहीं, खुशियां परोसते हैं। वर्षों से अपने शहरवासियों को सर्वोत्तम और शुद्ध व्यंजन उपलब्ध कराना हमारा संकल्प रहा है। ताज़ा मसालों और पारंपरिक रेसिपी के साथ बना हर निवाला आपके दिल को छू जाएगा।",
                established_year="2018",
                image_url=hero_img,
                stats=[
                    {"label": "सालों का विश्वास", "value": "7+ Years"},
                    {"label": "संतुष्ट ग्राहक", "value": "50,000+"},
                    {"label": "विशेष व्यंजन", "value": "30+ Items"},
                ],
            )

        elif s_type in ("highlights", "features", "trust"):
            s_type = "highlights"
            t = title or "हमारी खासियत (Why Choose Us)"
            sub = subtitle or "ग्राहकों का पसंदीदा और भरोसेमंद विकल्प"
            new_sec_data.highlights = [
                HighlightItem(title="Google Verified", description=f"{self.profile.rating or 4.8}★ रेटिंग के साथ ग्राहकों का भरोसा", icon="star"),
                HighlightItem(title="100% शुद्ध और ताज़ा", description="सर्वोत्तम सामग्री और स्वच्छता का वादा", icon="leaf"),
                HighlightItem(title="तेज़ डिलीवरी व पार्सल", description="WhatsApp पर ऑर्डर करें और तुरंत पाएं", icon="truck"),
                HighlightItem(title="सुलभ और उचित दाम", description="उत्कृष्ट गुणवत्ता सर्वोत्तम मूल्य पर", icon="award"),
            ]

        elif s_type in ("offers", "offer", "discount", "banner"):
            s_type = "offers"
            t = title or "विशेष छूट और ऑफर्स"
            sub = subtitle or "सीमित समय के लिए विशेष बचत"
            new_sec_data.banner = BannerItem(
                badge="लिमिटेड टाइम ऑफर",
                title="₹300 से अधिक के हर ऑर्डर पर विशेष 10% की छूट!",
                subtitle="WhatsApp पर ऑर्डर करते समय 'ICCHA10' कोड का इस्तेमाल करें।",
                cta_text="अभी WhatsApp पर ऑर्डर करें",
                cta_link=f"https://wa.me/{self.profile.whatsapp or '919876543210'}",
            )

        elif s_type in ("faq", "faqs", "help"):
            s_type = "faq"
            t = title or "अक्सर पूछे जाने वाले सवाल (FAQ)"
            sub = subtitle or "दुकान, ऑर्डर और डिलीवरी से जुड़ी महत्वपूर्ण जानकारी"
            new_sec_data.faqs = [
                FAQItem(question="क्या होम डिलीवरी की सुविधा उपलब्ध है?", answer="जी हाँ, हम आसपास के इलाकों में तेज़ होम डिलीवरी और पार्सल सेवा प्रदान करते हैं। आप WhatsApp या कॉल के ज़रिए ऑर्डर दे सकते हैं।"),
                FAQItem(question="दुकान के खुलने और बंद होने का समय क्या है?", answer=f"हमारी दुकान {self.profile.hours.days or 'प्रतिदिन'} {self.profile.hours.open_time} से {self.profile.hours.close_time} तक खुली रहती है।"),
                FAQItem(question="भुगतान के कौन-कौन से तरीके उपलब्ध हैं?", answer="हम UPI (Google Pay, PhonePe, Paytm), नकद (Cash) और कार्ड भुगतान स्वीकार करते हैं।"),
                FAQItem(question="क्या शुद्ध शाकाहारी विकल्प उपलब्ध हैं?", answer="जी हाँ, हमारी रसोई में शुद्धता और स्वच्छता का विशेष ध्यान रखा जाता है।"),
            ]

        else:
            s_type = "custom"
            t = title or "विशेष अनुभाग"
            sub = subtitle or ""

        # Insert before contact if contact exists, otherwise append
        contact_idx = next((i for i, s in enumerate(self.profile.sections) if s.type == "contact"), -1)
        new_section = SiteSection(
            id=f"sec-{s_type}-{len(self.profile.sections)+1}",
            type=s_type,
            title=t,
            subtitle=sub,
            enabled=True,
            data=new_sec_data,
        )

        if contact_idx >= 0:
            self.profile.sections.insert(contact_idx, new_section)
        else:
            self.profile.sections.append(new_section)

        await self._broadcast_profile(context)
        return f"Successfully added '{s_type}' section with heading '{t}'."


    @function_tool
    async def remove_section(
        self,
        context: RunContext,
        section_type: str,
    ) -> str:
        """
        Remove a section from the website storefront.

        Args:
            section_type: Type of section to remove ('reviews', 'gallery', 'story', 'highlights', 'offers', 'faq', 'contact').
        """
        target = section_type.strip().lower()
        self.profile.ensure_default_sections()
        original_len = len(self.profile.sections)
        self.profile.sections = [s for s in self.profile.sections if s.type != target]
        removed_count = original_len - len(self.profile.sections)

        await self._broadcast_profile(context)
        if removed_count > 0:
            return f"Removed '{section_type}' section from the website."
        return f"Section '{section_type}' was not found on the website."


    @function_tool
    async def add_review(
        self,
        context: RunContext,
        author_name: str,
        rating: int = 5,
        text: str = "",
    ) -> str:
        """
        Add a customer review or testimonial to the Google Reviews section.

        Args:
            author_name: Name of reviewer (e.g. 'विकास गुप्ता').
            rating: Star rating 1 to 5 (default 5).
            text: Review text or compliment.
        """
        self.profile.ensure_default_sections()
        rev_sec = next((s for s in self.profile.sections if s.type == "reviews"), None)
        if not rev_sec:
            await self.add_section(context, "reviews")
            rev_sec = next((s for s in self.profile.sections if s.type == "reviews"), None)

        if rev_sec:
            new_rev = ReviewItem(
                author_name=author_name,
                rating=min(5, max(1, rating)),
                text=text or "शानदार स्वाद और बेहतरीन सेवा! बहुत पसंद आया।",
                relative_time="आज (Today)",
                verified=True,
            )
            rev_sec.data.reviews.insert(0, new_rev)
            await self._broadcast_profile(context)
            return f"Added 5★ review from '{author_name}' to reviews section."

        return "Could not add review."


    @function_tool
    async def add_gallery_photo(
        self,
        context: RunContext,
        search_query_or_url: str,
        caption: str | None = None,
    ) -> str:
        """
        Add a photo to the storefront gallery from Unsplash or direct image URL.

        Args:
            search_query_or_url: Search term (e.g. 'crispy dosa', 'biryani handi') or direct photo URL.
            caption: Optional caption for the photo.
        """
        self.profile.ensure_default_sections()
        gal_sec = next((s for s in self.profile.sections if s.type == "gallery"), None)
        if not gal_sec:
            await self.add_section(context, "gallery")
            gal_sec = next((s for s in self.profile.sections if s.type == "gallery"), None)

        img_url = search_query_or_url.strip()
        if not img_url.startswith(("http://", "https://")):
            photos = await search_unsplash_photos(img_url, count=1)
            img_url = photos[0]["url"] if photos else ""

        if gal_sec and img_url:
            gal_sec.data.gallery.append(
                GalleryItem(
                    url=img_url,
                    alt=search_query_or_url,
                    caption=caption or "स्वादिष्ट व्यंजन (Freshly Prepared)",
                    tag="Special",
                )
            )
            await self._broadcast_profile(context)
            return f"Added new photo to gallery for '{search_query_or_url}'."

        return "Could not fetch or add gallery photo."


    @function_tool
    async def set_hero_image(
        self,
        context: RunContext,
        query_or_url: str,
    ) -> str:
        """
        Set or update the background cover image for the website hero header.

        Args:
            query_or_url: Photo description (e.g. 'luxurious indian restaurant dining', 'street food stall') or direct image URL.
        """
        img_url = query_or_url.strip()
        if not img_url.startswith(("http://", "https://")):
            photos = await search_unsplash_photos(img_url, count=1, orientation="landscape")
            img_url = photos[0]["url"] if photos else ""

        if img_url:
            self.profile.header_image = img_url
            self.profile.ensure_default_sections()
            hero_sec = next((s for s in self.profile.sections if s.type == "hero"), None)
            if hero_sec:
                hero_sec.data.image_url = img_url
            await self._broadcast_profile(context)
            return f"Hero banner cover image updated successfully."

        return "Could not update hero image."


    @function_tool
    async def set_product_image(
        self,
        context: RunContext,
        product_name: str,
        query_or_url: str,
    ) -> str:
        """
        Set or update the photo of a specific product or menu item.

        Args:
            product_name: Name of product (e.g. 'Veg Biryani').
            query_or_url: Description of image or direct image URL.
        """
        target = product_name.strip().lower()
        matched_item = None
        for p in self.profile.products:
            if target in p.name.lower() or p.name.lower() in target:
                matched_item = p
                break

        if not matched_item:
            return f"Product '{product_name}' was not found in catalog."

        img_url = query_or_url.strip()
        if not img_url.startswith(("http://", "https://")):
            img_url = await fetch_product_image(query_or_url, category=self.profile.category)

        matched_item.image_url = img_url
        await self._broadcast_profile(context)
        return f"Updated image for '{matched_item.name}'."


    @function_tool
    async def auto_populate_images(
        self,
        context: RunContext,
    ) -> str:
        """
        Automatically fetch and assign high-quality Unsplash photos for all products and hero banner.
        Call this when user asks to add photos to items or make the website look complete and professional.
        """
        updated_count = 0
        for p in self.profile.products:
            if not p.image_url:
                p.image_url = await fetch_product_image(p.name, category=self.profile.category)
                updated_count += 1

        if not self.profile.header_image:
            self.profile.header_image = await fetch_hero_cover(self.profile.shop_name, category="restaurant")

        self.profile.ensure_default_sections()
        hero_sec = next((s for s in self.profile.sections if s.type == "hero"), None)
        if hero_sec and not hero_sec.data.image_url:
            hero_sec.data.image_url = self.profile.header_image

        await self._broadcast_profile(context)
        return f"Auto-populated photos for {updated_count} products and storefront header."


