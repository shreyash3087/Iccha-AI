"""
Google Places API integration for ICCHA AI.

Searches for an existing business location using Google Places Text Search (New).
Allows the voice agent to pre-populate address, rating, operating hours, and phone
number, asking the shopkeeper only to confirm or update what Google has on record.
"""

from __future__ import annotations

import logging
from dataclasses import asdict, dataclass
from typing import Any

import httpx

from iccha.config import get_settings

logger = logging.getLogger(__name__)

PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
DEFAULT_TIMEOUT_SECONDS = 3.5


@dataclass
class PlacesLookupResult:
    """Standardised result returned by Google Places lookup."""

    found: bool
    shop_name: str | None = None
    formatted_address: str | None = None
    rating: float | None = None
    user_rating_count: int | None = None
    phone: str | None = None
    places_id: str | None = None
    weekday_hours: list[str] | None = None
    message: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for tool calling response."""
        return {k: v for k, v in asdict(self).items() if v is not None}


async def lookup_google_places(
    business_name: str,
    locality: str = "",
    *,
    api_key: str | None = None,
    client: httpx.AsyncClient | None = None,
) -> PlacesLookupResult:
    """
    Search Google Places Text Search for a retail shop.

    Args:
        business_name: Spoken shop name (e.g. 'Gupta General Store')
        locality: Locality, market, or city (e.g. 'Sector 18 Noida' or 'Lajpat Nagar')
        api_key: Optional override; defaults to settings.google_places_api_key
        client: Optional httpx.AsyncClient for connection reuse / mocking

    Returns:
        PlacesLookupResult with matched details or found=False.
    """
    settings = get_settings()
    key = api_key or settings.google_places_api_key

    if not key:
        logger.debug("Google Places API key not set — returning unconfigured fallback")
        return PlacesLookupResult(
            found=False,
            message=(
                f"Google Places API not configured. Verified shop details as heard: "
                f"'{business_name}' in '{locality}'."
            ),
        )

    text_query = f"{business_name}, {locality}".strip(" ,")
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": (
            "places.id,places.displayName,places.formattedAddress,"
            "places.rating,places.userRatingCount,places.regularOpeningHours,"
            "places.nationalPhoneNumber"
        ),
    }
    payload = {
        "textQuery": text_query,
        "languageCode": "hi",  # Hindi preference for local Indian names
    }

    own_client = False
    if client is None:
        client = httpx.AsyncClient(timeout=DEFAULT_TIMEOUT_SECONDS)
        own_client = True

    try:
        response = await client.post(PLACES_SEARCH_URL, headers=headers, json=payload)
        if response.status_code != 200:
            logger.warning(
                "Google Places lookup HTTP %d: %s",
                response.status_code,
                response.text[:200],
            )
            return PlacesLookupResult(
                found=False,
                message=f"Google Places search returned status {response.status_code}.",
            )

        data = response.json()
        places = data.get("places", [])
        if not places:
            return PlacesLookupResult(
                found=False,
                message=f"No matching business found on Google Places for '{text_query}'.",
            )

        top_place = places[0]
        display_name = top_place.get("displayName", {}).get("text", business_name)
        address = top_place.get("formattedAddress")
        rating = top_place.get("rating")
        review_count = top_place.get("userRatingCount")
        phone = top_place.get("nationalPhoneNumber")
        places_id = top_place.get("id")

        weekday_hours = (
            top_place.get("regularOpeningHours", {}).get("weekdayDescriptions")
        )

        return PlacesLookupResult(
            found=True,
            shop_name=display_name,
            formatted_address=address,
            rating=rating,
            user_rating_count=review_count,
            phone=phone,
            places_id=places_id,
            weekday_hours=weekday_hours,
            message=f"Found '{display_name}' on Google Places with rating {rating}★ ({review_count} reviews).",
        )

    except httpx.TimeoutException:
        logger.warning("Google Places lookup timed out after %ss", DEFAULT_TIMEOUT_SECONDS)
        return PlacesLookupResult(
            found=False,
            message="Google Places request timed out. Proceeding with spoken details.",
        )
    except Exception as e:
        logger.exception("Error during Google Places lookup")
        return PlacesLookupResult(
            found=False,
            message=f"Lookup failed: {str(e)}",
        )
    finally:
        if own_client:
            await client.aclose()
