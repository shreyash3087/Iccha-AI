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
import re
import secrets
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field


class BusinessCategory(str, Enum):
    """Common business categories in Indian markets."""

    KIRANA = "kirana"  # Grocery / General Store
    CLOTHING = "clothing"  # Saree, garments, tailoring
    ELECTRONICS = "electronics"  # Mobile, repairs, accessories
    PHARMACY = "pharmacy"  # Chemist, medical store
    SWEETS_FOOD = "sweets_food"  # Mithai, chai, snacks, restaurant, bakery
    HARDWARE = "hardware"  # Sanitary, paint, electricals
    SERVICES = "services"  # Salon, laundry, repairs, plumbing, clinic
    OTHER = "other"


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


class BusinessProfile(BaseModel):
    """
    Complete extracted business profile for the merchant.

    Accumulated incrementally during the voice interview session and
    broadcast to the frontend over LiveKit DataChannel for live preview.
    """

    shop_name: str = Field(..., description="Official name of the shop, e.g. 'गुप्ता किराना स्टोर'")
    business_type: Literal["retail", "service", "restaurant_cafe", "general"] = Field(
        default="retail",
        description="Type of business (retail store, service shop, restaurant/cafe, general)"
    )
    owner_name: str | None = Field(default=None, description="Name of the shopkeeper/merchant")
    category: BusinessCategory = Field(default=BusinessCategory.KIRANA, description="Business vertical")
    tagline: str | None = Field(default=None, description="Catchy Hindi/English tagline")
    locality: str | None = Field(default=None, description="Neighbourhood or market, e.g. 'Sector 18' or 'Lajpat Nagar'")
    city: str | None = Field(default=None, description="City name, e.g. 'Noida', 'Delhi'")
    address: str | None = Field(default=None, description="Full postal or landmark address")
    phone: str | None = Field(default=None, description="Primary contact/order phone number (10 digits)")
    whatsapp: str | None = Field(default=None, description="WhatsApp business number for orders")
    hours: BusinessHours = Field(default_factory=BusinessHours, description="Opening hours")
    products: list[ProductItem] = Field(default_factory=list, description="Featured products/services list")
    offers: list[str] = Field(default_factory=list, description="Current deals or highlights, e.g. 'Free home delivery'")

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

    def ensure_temp_slug(self) -> str:
        """Generate or return existing temp website slug and route."""
        if not self.temp_slug:
            # Clean shop name to safe latin/ascii or fallback
            clean_name = re.sub(r"[^\w\s-]", "", self.shop_name.lower().strip())
            clean_name = re.sub(r"[\s_]+", "-", clean_name).strip("-")
            if not clean_name:
                clean_name = "my-store"
            suffix = secrets.token_hex(2)
            self.temp_slug = f"{clean_name[:24]}-{suffix}"
            self.temp_url = f"/temp/{self.temp_slug}"
        return self.temp_slug

    def to_event_payload(self) -> dict[str, Any]:
        """Convert to JSON-serializable dictionary for LiveKit DataChannel broadcast."""
        # Ensure temp_slug is ready
        self.ensure_temp_slug()
        return {
            "type": "BUSINESS_PROFILE_UPDATE",
            "profile": self.model_dump(mode="json"),
        }

    def to_event_json(self) -> str:
        """Convert to JSON string for transmission over LiveKit DataChannel."""
        return json.dumps(self.to_event_payload(), ensure_ascii=False)
