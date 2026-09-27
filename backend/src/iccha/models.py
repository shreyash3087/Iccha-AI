"""
Pydantic data models for ICCHA AI business profile extraction.

Defines the structured schema used during Phase 3 conversation flow:
- GooglePlaceCandidate: Potential matches from Google Places Text Search
- ProductItem / OfferingItem: Individual items or services sold by the merchant
- BusinessHours: Store operating schedule
- BusinessProfile: Complete extracted business profile ready for website generation
"""

from __future__ import annotations

import json
import secrets
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field


class BusinessCategory(str, Enum):
    """
    Top-level business category used for template selection and agent routing.

    - PRODUCT: Shops that primarily sell physical goods (kirana, hardware, electronics,
               clothing, pharmacy, sweets, etc.)
    - SERVICE: Shops that primarily offer services (salon, repair, tailor, clinic, etc.)
    - OTHER:   Mixed or uncategorized businesses
    """

    PRODUCT = "product"  # Retail / product-based shop
    SERVICE = "service"  # Service-based shop
    OTHER = "other"     # General / mixed

    # Backward compatibility aliases
    KIRANA = "product"
    RETAIL = "product"
    SALON = "service"
    REPAIR = "service"
    TAILOR = "service"
    FOOD = "product"
    GENERAL = "other"


class GooglePlaceCandidate(BaseModel):
    """A matched business from Google Places."""

    place_id: str = Field(..., description="Unique Google Places ID")
    name: str = Field(..., description="Business name on Google Maps")
    address: str = Field(..., description="Formatted address / landmark")
    rating: float | None = Field(default=None, description="Average star rating (e.g. 4.6)")
    user_ratings_total: int | None = Field(default=None, description="Total review count")


class ProductItem(BaseModel):
    """An individual product or service offered by the merchant."""

    name: str = Field(..., description="Name of the product or service, e.g. 'Basmati Rice' or 'Screen Replacement'")
    price: float | None = Field(default=None, description="Price in INR (₹)")
    unit: str | None = Field(default=None, description="Unit of measurement, e.g. 'kg', 'packet', 'service', 'hour'")
    item_type: Literal["product", "service"] = Field(default="product", description="Whether this is a physical item or service")
    description: str | None = Field(default=None, description="Short description or specialty")
    category: str | None = Field(default=None, description="Optional sub-category")
    image_url: str | None = Field(default=None, description="High-resolution product photo URL")

    def display_str(self) -> str:
        """Formatted string for spoken read-back or UI display."""
        if self.price is not None:
            unit_str = f" per {self.unit}" if self.unit else ""
            return f"{self.name} - ₹{self.price:.0f}{unit_str}"
        return self.name


# Type alias for clear semantic usage
OfferingItem = ProductItem


class BusinessHours(BaseModel):
    """Store operating schedule."""

    days: str = Field(default="Monday - Saturday", description="Days of operation, e.g. 'Monday - Saturday' or 'सोमवार से शनिवार'")
    open_time: str = Field(default="09:00 AM", description="Opening time, e.g. '09:00 AM'")
    close_time: str = Field(default="09:00 PM", description="Closing time, e.g. '09:00 PM'")
    closed_days: list[str] = Field(default_factory=lambda: ["Sunday"], description="Days when the shop is closed")


# ── Spec-Driven Modular Sections & Design Tokens ──────────────────────────────

class ReviewItem(BaseModel):
    """Customer testimonial or Google Place review."""

    id: str = Field(default_factory=lambda: secrets.token_hex(4))
    author_name: str = Field(..., description="Customer name, e.g. 'Rahul Sharma'")
    rating: int = Field(default=5, ge=1, le=5, description="Star rating (1 to 5)")
    text: str = Field(..., description="Review comment text")
    relative_time: str = Field(default="हाल ही में", description="Relative time, e.g. '2 दिन पहले'")
    verified: bool = Field(default=True, description="Whether this is a verified Google review")


class GalleryItem(BaseModel):
    """Ambiance or showcase photo for the storefront gallery."""

    id: str = Field(default_factory=lambda: secrets.token_hex(4))
    url: str = Field(..., description="High-resolution image URL")
    alt: str = Field(default="", description="Accessible image description")
    caption: str | None = Field(default=None, description="Short photo caption")
    tag: str | None = Field(default=None, description="Category tag, e.g. 'Dishes', 'Ambiance'")


class HighlightItem(BaseModel):
    """Trust badge or key selling point."""

    id: str = Field(default_factory=lambda: secrets.token_hex(4))
    title: str = Field(..., description="Feature title, e.g. '100% Shuddh Shakahari'")
    description: str = Field(..., description="Feature explanation")
    icon: str = Field(default="star", description="Icon name: star, shield, truck, leaf, clock, award")


class FAQItem(BaseModel):
    """Frequently Asked Question."""

    id: str = Field(default_factory=lambda: secrets.token_hex(4))
    question: str = Field(..., description="Question in Hindi or English")
    answer: str = Field(..., description="Helpful answer")


class StorySectionData(BaseModel):
    """About us / merchant heritage story."""

    heading: str | None = Field(default="हमारी कहानी (Our Story)")
    content: str | None = Field(default=None)
    established_year: str | None = Field(default=None)
    image_url: str | None = Field(default=None)
    stats: list[dict[str, str]] = Field(default_factory=list)


class BannerItem(BaseModel):
    """Promotional offer or announcement banner."""

    id: str = Field(default_factory=lambda: secrets.token_hex(4))
    badge: str | None = Field(default=None, description="Badge text, e.g. 'विशेष ऑफर'")
    title: str = Field(..., description="Banner headline")
    subtitle: str | None = Field(default=None)
    cta_text: str | None = Field(default=None)
    cta_link: str | None = Field(default=None)


class SiteSectionData(BaseModel):
    """Container for section-specific payload."""

    reviews: list[ReviewItem] = Field(default_factory=list)
    gallery: list[GalleryItem] = Field(default_factory=list)
    highlights: list[HighlightItem] = Field(default_factory=list)
    faqs: list[FAQItem] = Field(default_factory=list)
    story: StorySectionData | None = None
    banner: BannerItem | None = None
    custom_html: str | None = None
    image_url: str | None = None


SectionType = Literal[
    "hero",
    "highlights",
    "catalog",
    "reviews",
    "gallery",
    "story",
    "offers",
    "faq",
    "contact",
    "custom",
]


class SiteSection(BaseModel):
    """A modular section block on the generated storefront."""

    id: str = Field(default_factory=lambda: secrets.token_hex(4))
    type: SectionType = Field(..., description="Section type discriminator")
    title: str | None = Field(default=None, description="Section heading")
    subtitle: str | None = Field(default=None, description="Section sub-heading or tagline")
    enabled: bool = Field(default=True, description="Whether section is active and visible")
    layout_variant: str = Field(default="default", description="Visual layout variant")
    data: SiteSectionData = Field(default_factory=SiteSectionData, description="Section data content")


class DesignTokens(BaseModel):
    """Design system tokens for this website."""

    font_family: str | None = Field(default="Inter, sans-serif")
    radius: Literal["none", "sm", "md", "lg", "full"] = Field(default="lg")
    shadow: Literal["none", "subtle", "elevated", "glow"] = Field(default="elevated")
    hero_layout: Literal["split", "centered", "banner", "minimal"] = Field(default="centered")
    header_image: str | None = Field(default=None)



class BusinessProfile(BaseModel):
    """
    Complete extracted business profile for the merchant.

    Accumulated incrementally during the voice interview session and
    broadcast to the frontend over LiveKit DataChannel for live preview.
    """

    shop_name: str = Field(..., description="Official name of the shop, e.g. 'गुप्ता किराना स्टोर'")
    owner_name: str | None = Field(default=None, description="Name of the shopkeeper/merchant")
    category: BusinessCategory = Field(
        default=BusinessCategory.PRODUCT,
        description="Top-level business category: 'product' (sells goods), 'service' (offers services), or 'other'"
    )
    template_id: str | None = Field(
        default=None,
        description="Design template to use for this storefront. Options depend on category: "
                    "product → 'product-classic', 'product-bold', 'product-minimal', 'product-warm', 'product-fresh'; "
                    "service → 'service-elegant', 'service-modern', 'service-warm', 'service-bold', 'service-clean'; "
                    "other → 'other-simple', 'other-grid', 'other-card', 'other-minimal', 'other-flex'. "
                    "The agent should choose the best-fitting template based on the merchant's description."
    )
    primary_color: str | None = Field(default=None, description="Custom primary brand color, e.g. '#800000' or 'maroon'")
    accent_color: str | None = Field(default=None, description="Custom accent brand color")
    tagline: str | None = Field(default=None, description="Catchy Hindi/English tagline")
    locality: str | None = Field(default=None, description="Neighbourhood or market, e.g. 'Sector 18' or 'Lajpat Nagar'")
    city: str | None = Field(default=None, description="City name, e.g. 'Noida', 'Delhi'")
    address: str | None = Field(default=None, description="Full postal or landmark address")
    phone: str | None = Field(default=None, description="Primary contact/order phone number (10 digits)")
    whatsapp: str | None = Field(default=None, description="WhatsApp business number for orders")
    hours: BusinessHours = Field(default_factory=BusinessHours, description="Opening hours")
    products: list[ProductItem] = Field(default_factory=list, description="Featured products/services list")
    offers: list[str] = Field(default_factory=list, description="Current deals or highlights, e.g. 'Free home delivery'")
    header_image: str | None = Field(default=None, description="Header / Hero background image URL")
    sections: list[SiteSection] = Field(default_factory=list, description="Spec-driven modular page sections")
    design_tokens: DesignTokens | None = Field(default=None, description="Design tokens for colors, typography, radius")

    # Google Places & Reviews
    rating: float | None = Field(default=None, description="Google Places star rating if verified")
    total_reviews: int | None = Field(default=None, description="Total Google Places reviews count")
    places_id: str | None = Field(default=None, description="Google Places ID if linked")
    verified_via_places: bool = Field(default=False, description="Whether details were confirmed from Google Places")
    google_candidates: list[GooglePlaceCandidate] = Field(
        default_factory=list,
        description="Candidate places when multiple matches are found"
    )
    wants_google_review_help: bool | None = Field(
        default=None,
        description="Whether merchant opted to create a Google Review / Business page (True=yes, False=skipped, None=pending)"
    )

    # Temporary Preview Website Route
    temp_slug: str | None = Field(default=None, description="URL slug for the temporary preview website")
    temp_url: str | None = Field(default=None, description="Full relative route, e.g. '/temp/sharma-kirana-4a9b'")
    interview_complete: bool = Field(default=False, description="True once final confirmation is approved")
    user_id: str | None = Field(default=None, description="Supabase user ID of owner")
    user_email: str | None = Field(default=None, description="Email of owner")
    approved: bool = Field(default=False, description="Whether merchant approved the site")
    approved_at: str | None = Field(default=None, description="ISO timestamp of site approval")

    @property
    def business_type(self) -> str:
        """Compatibility property mapping category to string value."""
        return self.category.value if isinstance(self.category, BusinessCategory) else str(self.category)

    @business_type.setter
    def business_type(self, val: str) -> None:
        try:
            self.category = BusinessCategory(val.lower())
        except ValueError:
            self.category = BusinessCategory.OTHER

    def update_temp_slug(self, force: bool = False) -> str:
        """
        Assign a short random ID as the temp URL for this store.

        Uses a URL-safe base32 short ID (8 chars) that is completely
        language-agnostic — works for any shop name in any script.

        If force=False, only generates a new ID if none exists yet.
        The shop name is stored in the JSON, not in the URL.

        NOTE: If temp_slug was externally pinned to a sessionId (done by
        server.py on room start), force=True will NOT overwrite it.
        This keeps the voice room, URL param, and saved site all in sync.
        """
        if not self.temp_slug:
            # No slug yet — generate one
            raw = secrets.token_urlsafe(6)  # 6 bytes → 8 base64url chars
            short_id = raw.replace("-", "a").replace("_", "b").lower()[:8]
            self.temp_slug = short_id
            self.temp_url = f"/temp/{self.temp_slug}"
        elif force and not self.temp_slug:
            # force=True but slug already set (from sessionId pin) → keep as-is
            pass

        return self.temp_slug or "preview"

    def ensure_temp_slug(self) -> str:
        """Ensure a temp ID exists. Does not regenerate if one already exists."""
        return self.update_temp_slug(force=False)

    def ensure_default_sections(self) -> list[SiteSection]:
        """Ensure standard page sections exist if none have been explicitly defined."""
        if self.sections:
            for s in self.sections:
                if s.type == "hero" and (not s.title or s.title == "मेरी दुकान" or s.title == "My Store"):
                    if self.shop_name and self.shop_name != "मेरी दुकान":
                        s.title = self.shop_name
            return self.sections

        is_food_or_product = self.category == BusinessCategory.PRODUCT
        sections: list[SiteSection] = []

        # 1. Hero Section
        sections.append(
            SiteSection(
                id="sec-hero",
                type="hero",
                title=self.shop_name if self.shop_name != "मेरी दुकान" else "Storefront",
                subtitle=self.tagline or (
                    f"{self.locality or self.city or 'शहर'} का सबसे पसंदीदा और विश्वसनीय प्रतिष्ठान"
                ),
                enabled=True,
                layout_variant="centered",
                data=SiteSectionData(
                    image_url=self.header_image or "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85",
                ),
            )
        )

        # 2. Highlights / Trust Badges
        highlights_list = [
            HighlightItem(
                id="hl-1",
                title="Google Verified",
                description=f"{self.rating or 4.6}★ रेटिंग के साथ ग्राहकों का भरोसा",
                icon="star",
            ),
            HighlightItem(
                id="hl-2",
                title="100% शुद्ध और ताज़ा",
                description="उच्चतम गुणवत्ता और स्वच्छता का वादा",
                icon="leaf",
            ),
            HighlightItem(
                id="hl-3",
                title="तेज़ डिलीवरी व सेवा",
                description="त्वरित सर्विस सीधा आप तक",
                icon="truck",
            ),
            HighlightItem(
                id="hl-4",
                title="सुलभ और उचित दाम",
                description="संतुष्टि की 100% गारंटी",
                icon="award",
            ),
        ]
        sections.append(
            SiteSection(
                id="sec-highlights",
                type="highlights",
                title="हमारी खासियत (Why Choose Us)",
                subtitle="हम अपने ग्राहकों को देते हैं बेहतरीन अनुभव और गुणवत्ता",
                enabled=True,
                data=SiteSectionData(highlights=highlights_list),
            )
        )

        # 3. Catalog / Offerings
        sections.append(
            SiteSection(
                id="sec-catalog",
                type="catalog",
                title="हमारा मेनू / रेट सूची" if is_food_or_product else "हमारी सेवाएं",
                subtitle="पसंदीदा आइटम चुनें और सीधे WhatsApp पर ऑर्डर भेजें",
                enabled=True,
            )
        )

        # 4. Google Reviews / Testimonials - Authentic Google Reviews Only (No Fake Reviews)
        sections.append(
            SiteSection(
                id="sec-reviews",
                type="reviews",
                title="ग्राहक समीक्षाएं (Google Reviews)",
                subtitle=f"{self.rating or 4.6}★ रेटिंग • {self.total_reviews or 100}+ संतुष्ट ग्राहकों का भरोसा",
                enabled=bool(self.rating or self.total_reviews),
                data=SiteSectionData(reviews=[]),
            )
        )

        # 5. Contact & Timings
        sections.append(
            SiteSection(
                id="sec-contact",
                type="contact",
                title="दुकान का समय और पता",
                subtitle="हमसे संपर्क करें या दुकान पर पधारें",
                enabled=True,
            )
        )

        self.sections = sections
        return self.sections

    def to_event_payload(self) -> dict[str, Any]:
        """Convert to JSON-serializable dictionary for LiveKit DataChannel broadcast."""
        # Ensure temp_slug and default sections are ready
        self.ensure_temp_slug()
        self.ensure_default_sections()
        return {
            "type": "BUSINESS_PROFILE_UPDATE",
            "profile": self.model_dump(mode="json"),
        }

    def to_event_json(self) -> str:
        """Convert to JSON string for transmission over LiveKit DataChannel."""
        return json.dumps(self.to_event_payload(), ensure_ascii=False)

