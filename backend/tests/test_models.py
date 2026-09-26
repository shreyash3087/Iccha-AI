"""
Unit tests for ICCHA AI data models (backend/src/iccha/models.py).
"""

from __future__ import annotations

import json

from iccha.models import (
    BusinessCategory,
    BusinessHours,
    BusinessProfile,
    ProductItem,
)


def test_product_item_display_str():
    p1 = ProductItem(name="Basmati Rice", price=350.0, unit="kg")
    assert p1.display_str() == "Basmati Rice - ₹350 per kg"

    p2 = ProductItem(name="Ladies Suit", price=1200.0)
    assert p2.display_str() == "Ladies Suit - ₹1200"

    p3 = ProductItem(name="Custom Tailoring")
    assert p3.display_str() == "Custom Tailoring"


def test_business_hours_defaults():
    hours = BusinessHours()
    assert hours.days == "Monday - Saturday"
    assert hours.open_time == "09:00 AM"
    assert hours.close_time == "09:00 PM"
    assert hours.closed_days == ["Sunday"]


def test_business_profile_serialization():
    profile = BusinessProfile(
        shop_name="गुप्ता किराना स्टोर",
        owner_name="रामेश गुप्ता",
        category=BusinessCategory.KIRANA,
        locality="Sector 18",
        city="Noida",
        phone="9876543210",
        products=[
            ProductItem(name="चावल", price=60.0, unit="kg"),
            ProductItem(name="दाल", price=120.0, unit="kg"),
        ],
        offers=["मुफ़्त होम डिलीवरी"],
    )

    payload = profile.to_event_payload()
    assert payload["type"] == "BUSINESS_PROFILE_UPDATE"
    assert payload["profile"]["shop_name"] == "गुप्ता किराना स्टोर"
    assert len(payload["profile"]["products"]) == 2
    assert payload["profile"]["products"][0]["name"] == "चावल"

    json_str = profile.to_event_json()
    parsed = json.loads(json_str)
    assert parsed["profile"]["locality"] == "Sector 18"
    assert parsed["profile"]["city"] == "Noida"
    assert parsed["profile"]["phone"] == "9876543210"


def test_business_profile_incremental_updates():
    profile = BusinessProfile(shop_name="Sharma Garments")
    assert profile.interview_complete is False
    assert len(profile.products) == 0

    profile.products.append(ProductItem(name="Kurti", price=500.0, unit="piece"))
    profile.products.append(ProductItem(name="Saree", price=1500.0, unit="piece"))
    profile.interview_complete = True

    assert len(profile.products) == 2
    assert profile.interview_complete is True
