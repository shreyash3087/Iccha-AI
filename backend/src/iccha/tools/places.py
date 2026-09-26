"""
Google Places API integration for ICCHA AI.

Searches for an existing business location using Google Places Text Search (New).
Allows the voice agent to:
1. Pre-populate address, rating, operating hours, and phone number when a single match is found.
2. Present options for the shopkeeper to choose from when multiple businesses match.
3. Suggest and help create a Google Review / Business page when no match is found.
"""

from __future__ import annotations

import logging
from dataclasses import asdict, dataclass, field
from typing import Any

import httpx

from iccha.config import get_settings
from iccha.models import GooglePlaceCandidate

logger = logging.getLogger(__name__)

PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
DEFAULT_TIMEOUT_SECONDS = 3.5


@dataclass
class PlacesLookupResult:
    """Standardised result returned by Google Places lookup."""

    found: bool
    status: str = "not_found"  # "found_single" | "multiple_candidates" | "not_found" | "unconfigured"
    shop_name: str | None = None
    formatted_address: str | None = None
    rating: float | None = None
    user_rating_count: int | None = None
    phone: str | None = None
    places_id: str | None = None
    weekday_hours: list[str] | None = None
    candidates: list[GooglePlaceCandidate] = field(default_factory=list)
    message: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for tool calling response."""
        res = asdict(self)
        if self.candidates:
            res["candidates"] = [c.model_dump() for c in self.candidates]
        return {k: v for k, v in res.items() if v is not None}


async def lookup_google_places(
    business_name: str,
    locality: str = "",
    *,
    api_key: str | None = None,
    client: httpx.AsyncClient | None = None,
) -> PlacesLookupResult:
    """
    Search Google Places Text Search for a retail or service shop.

    Args:
        business_name: Spoken shop name (e.g. 'Gupta General Store')
        locality: Locality, market, or city (e.g. 'Sector 18 Noida' or 'Lajpat Nagar')
        api_key: Optional override; defaults to settings.google_places_api_key
        client: Optional httpx.AsyncClient for connection reuse / mocking

    Returns:
        PlacesLookupResult with matched details, multiple candidates, or found=False.
    """
    settings = get_settings()
    key = api_key or settings.google_places_api_key

    if not key:
        logger.debug("Google Places API key not set — returning unconfigured fallback")
        return PlacesLookupResult(
            found=False,
            status="unconfigured",
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
                status="error",
                message=f"Google Places search returned status {response.status_code}.",
            )

        data = response.json()
        raw_places = data.get("places", [])
        if not raw_places:
            return PlacesLookupResult(
                found=False,
                status="not_found",
                message=f"No matching business found on Google Places for '{text_query}'.",
            )

        # Parse candidates (up to 3)
        parsed_candidates: list[GooglePlaceCandidate] = []
        for p in raw_places[:3]:
            pid = p.get("id") or ""
            name = p.get("displayName", {}).get("text", business_name)
            addr = p.get("formattedAddress") or ""
            rat = p.get("rating")
            cnt = p.get("userRatingCount")
            parsed_candidates.append(
                GooglePlaceCandidate(
                    place_id=pid,
                    name=name,
                    address=addr,
                    rating=rat,
                    user_ratings_total=cnt,
                )
            )

        # Multiple candidates scenario
        if len(parsed_candidates) > 1:
            return PlacesLookupResult(
                found=True,
                status="multiple_candidates",
                candidates=parsed_candidates,
                message=(
                    f"Found {len(parsed_candidates)} matching businesses for '{text_query}'. "
                    f"Please ask the user which option is their shop."
                ),
            )

        # Single candidate scenario
        top_place = raw_places[0]
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
            status="found_single",
            shop_name=display_name,
            formatted_address=address,
            rating=rating,
            user_rating_count=review_count,
            phone=phone,
            places_id=places_id,
            weekday_hours=weekday_hours,
            candidates=parsed_candidates,
            message=f"Found '{display_name}' on Google Places with rating {rating}★ ({review_count} reviews).",
        )

    except httpx.TimeoutException:
        logger.warning("Google Places lookup timed out after %ss", DEFAULT_TIMEOUT_SECONDS)
        return PlacesLookupResult(
            found=False,
            status="timeout",
            message="Google Places request timed out. Proceeding with spoken details.",
        )
    except Exception as e:
        logger.exception("Error during Google Places lookup")
        return PlacesLookupResult(
            found=False,
            status="error",
            message=f"Lookup failed: {str(e)}",
        )
    finally:
        if own_client:
            await client.aclose()
