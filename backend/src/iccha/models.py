"""
Pydantic data models for ICCHA AI business profile extraction.

Defines the structured schema used during Phase 3 conversation flow:
- ProductItem: Individual items/services sold by the merchant
- BusinessHours: Store operating schedule
- BusinessProfile: Complete extracted business profile ready for website generation
"""

from __future__ import annotations

import json
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class BusinessCategory(str, Enum):
    """Common retail business categories in Indian markets."""

    KIRANA = "kirana"  # Grocery / General Store
    CLOTHING = "clothing"  # Saree, garments, tailoring
    ELECTRONICS = "electronics"  # Mobile, repairs, accessories
    PHARMACY = "pharmacy"  # Chemist, medical store
    SWEETS_FOOD = "sweets_food"  # Mithai, chai, snacks, bakery
    HARDWARE = "hardware"  # Sanitary, paint, building materials
    SERVICES = "services"  # Salon, laundry, repair services
    OTHER = "other"


class ProductItem(BaseModel):
    """An individual item or service sold by the merchant."""

    name: str = Field(..., description="Name of the product or service, e.g. 'Basmati Rice' or 'Ladies Suit'")
    price: float | None = Field(default=None, description="Price in INR (₹)")
    unit: str | None = Field(default=None, description="Unit of measurement, e.g. 'kg', 'packet', 'piece', 'meter'")
    description: str | None = Field(default=None, description="Short product description or specialty")

    def display_str(self) -> str:
        """Formatted string for spoken read-back or UI display."""
        if self.price is not None:
            unit_str = f" per {self.unit}" if self.unit else ""
            return f"{self.name} - ₹{self.price:.0f}{unit_str}"
        return self.name


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
    rating: float | None = Field(default=None, description="Google Places star rating if verified")
    total_reviews: int | None = Field(default=None, description="Total Google Places reviews count")
    places_id: str | None = Field(default=None, description="Google Places ID if linked")
    verified_via_places: bool = Field(default=False, description="Whether details were confirmed from Google Places")
    interview_complete: bool = Field(default=False, description="True once final confirmation is approved")

    def to_event_payload(self) -> dict[str, Any]:
        """Convert to JSON-serializable dictionary for LiveKit DataChannel broadcast."""
        return {
            "type": "BUSINESS_PROFILE_UPDATE",
            "profile": self.model_dump(mode="json"),
        }

    def to_event_json(self) -> str:
        """Convert to JSON string for transmission over LiveKit DataChannel."""
        return json.dumps(self.to_event_payload(), ensure_ascii=False)
