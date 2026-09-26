"""
Unit tests for Google Places lookup tool (backend/src/iccha/tools/places.py).
"""

from __future__ import annotations

import httpx
import pytest

from iccha.tools.places import PlacesLookupResult, lookup_google_places


@pytest.mark.asyncio
async def test_places_unconfigured_fallback():
    result = await lookup_google_places("Gupta Store", "Noida", api_key=None)
    assert isinstance(result, PlacesLookupResult)
    assert result.found is False
    assert "not configured" in result.message


@pytest.mark.asyncio
async def test_places_successful_response():
    mock_response_data = {
        "places": [
            {
                "id": "places_12345",
                "displayName": {"text": "Gupta General Store"},
                "formattedAddress": "Shop 4, Block B, Sector 18, Noida, Uttar Pradesh 201301",
                "rating": 4.6,
                "userRatingCount": 128,
                "nationalPhoneNumber": "098765 43210",
                "regularOpeningHours": {
                    "weekdayDescriptions": [
                        "Monday: 9:00 AM – 9:00 PM",
                        "Tuesday: 9:00 AM – 9:00 PM",
                    ]
                },
            }
        ]
    }

    # Custom mock transport
    transport = httpx.MockTransport(
        lambda request: httpx.Response(200, json=mock_response_data)
    )

    async with httpx.AsyncClient(transport=transport) as client:
        result = await lookup_google_places(
            "Gupta General Store",
            "Sector 18 Noida",
            api_key="fake-test-key",
            client=client,
        )

    assert result.found is True
    assert result.shop_name == "Gupta General Store"
    assert result.rating == 4.6
    assert result.user_rating_count == 128
    assert "Sector 18, Noida" in result.formatted_address
    assert result.places_id == "places_12345"


@pytest.mark.asyncio
async def test_places_no_matches_found():
    mock_response_data = {"places": []}
    transport = httpx.MockTransport(
        lambda request: httpx.Response(200, json=mock_response_data)
    )

    async with httpx.AsyncClient(transport=transport) as client:
        result = await lookup_google_places(
            "Nonexistent Unique Shop Name",
            "Nowhere",
            api_key="fake-test-key",
            client=client,
        )

    assert result.found is False
    assert "No matching business found" in result.message


@pytest.mark.asyncio
async def test_places_http_error():
    transport = httpx.MockTransport(
        lambda request: httpx.Response(403, json={"error": "API key invalid"})
    )

    async with httpx.AsyncClient(transport=transport) as client:
        result = await lookup_google_places(
            "Gupta Store",
            "Noida",
            api_key="invalid-key",
            client=client,
        )

    assert result.found is False
    assert "status 403" in result.message
