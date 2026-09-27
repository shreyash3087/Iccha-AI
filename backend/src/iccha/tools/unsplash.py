"""
Unsplash Image Integration for ICCHA AI.

Fetches high-resolution, production-grade photography for:
- Food and retail product catalog items
- Storefront Hero cover banners
- Store ambiance / product showcase gallery
- About Us / Story banners

Includes fallback curated Unsplash photos to ensure 100% reliability even if
the API key is rate-limited or network connectivity fluctuates.
"""

from __future__ import annotations

import asyncio
import json
import logging
import urllib.parse
import urllib.request
from typing import Any

from iccha.config import get_settings

logger = logging.getLogger(__name__)

# Curated high-res Unsplash photos for common Indian food and retail items
CURATED_FALLBACK_IMAGES: dict[str, str] = {
    # Food & Restaurant
    "biryani": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    "veg biryani": "https://images.unsplash.com/photo-1642821373181-696a54913e9a?auto=format&fit=crop&w=800&q=80",
    "paneer": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80",
    "paneer biryani": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80",
    "rice": "https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=800&q=80",
    "jeera rice": "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80",
    "steam rice": "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=800&q=80",
    "curd rice": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80",
    "thali": "https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=800&q=80",
    "dal": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
    "roti": "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80",
    "naan": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    "samosa": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    "chai": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
    "sweets": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80",
    "dessert": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
    "restaurant hero": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85",
    "food hero": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85",
    "indian restaurant": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1200&q=85",

    # Retail / Kirana / General
    "grocery": "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80",
    "kirana": "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
    "spices": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80",
    "electronics": "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80",
    "clothing": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
    "salon": "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
    "default": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
}


def _get_fallback_image(query: str) -> str:
    """Find the closest fallback image based on keywords in query."""
    q_lower = query.lower()
    for key, url in CURATED_FALLBACK_IMAGES.items():
        if key in q_lower:
            return url
    return CURATED_FALLBACK_IMAGES["default"]


def _sync_fetch_unsplash(query: str, count: int = 1, orientation: str = "landscape") -> list[dict[str, Any]]:
    """Synchronous Unsplash search call executed via asyncio.to_thread."""
    settings = get_settings()
    access_key = settings.unsplash_access_key
    if not access_key:
        logger.warning("UNSPLASH_ACCESS_KEY not configured, using fallback image")
        return []

    try:
        encoded_q = urllib.parse.quote_plus(query)
        url = f"https://api.unsplash.com/search/photos?query={encoded_q}&per_page={count}&orientation={orientation}"
        req = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Client-ID {access_key}",
                "Accept-Version": "v1",
                "User-Agent": "IcchaAI/1.0",
            },
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            results = data.get("results", [])
            output = []
            for item in results:
                urls = item.get("urls", {})
                regular = urls.get("regular") or urls.get("small")
                small = urls.get("small") or regular
                alt = item.get("alt_description") or item.get("description") or query
                output.append({
                    "url": regular,
                    "thumb": small,
                    "alt": alt,
                    "photographer": item.get("user", {}).get("name", "Unsplash Contributor"),
                })
            return output
    except Exception as e:
        logger.warning("Unsplash API query '%s' failed: %s", query, e)
        return []


async def search_unsplash_photos(
    query: str,
    count: int = 1,
    orientation: str = "landscape",
) -> list[dict[str, Any]]:
    """
    Search Unsplash for photos matching query.
    Returns list of dicts with url, thumb, alt, and photographer.
    """
    results = await asyncio.to_thread(_sync_fetch_unsplash, query, count, orientation)
    if not results:
        # Fallback
        fallback_url = _get_fallback_image(query)
        return [{
            "url": fallback_url,
            "thumb": fallback_url,
            "alt": query,
            "photographer": "Unsplash",
        }]
    return results


async def fetch_product_image(item_name: str, category: str = "food") -> str:
    """
    Fetch a single high-quality photo URL for a menu/catalog product.
    Enhances the search query with Indian cuisine / retail context for better matches.
    """
    # Build a targeted search term
    clean_name = item_name.strip()
    search_query = f"{clean_name} indian food dish" if category in ("food", "restaurant", "product") else f"{clean_name} product"
    photos = await search_unsplash_photos(search_query, count=1, orientation="squarish")
    if photos and photos[0].get("url"):
        return photos[0]["url"]
    return _get_fallback_image(clean_name)


async def fetch_hero_cover(shop_name: str, category: str = "restaurant") -> str:
    """Fetch a wide landscape cover photo for the storefront hero section."""
    search_query = f"indian {category} restaurant dining food banner" if category in ("food", "restaurant") else f"{shop_name} store interior modern"
    photos = await search_unsplash_photos(search_query, count=1, orientation="landscape")
    if photos and photos[0].get("url"):
        return photos[0]["url"]
    return CURATED_FALLBACK_IMAGES["restaurant hero"]


async def fetch_gallery_photos(shop_name: str, count: int = 6) -> list[dict[str, str]]:
    """Fetch a collection of 4-6 diverse photos for the storefront gallery section."""
    terms = [
        f"{shop_name} delicious indian food dish",
        "restaurant dining atmosphere spices",
        "tasty biryani curry indian feast",
        "freshly cooked indian cuisine appetizing",
        "traditional indian dinner table setting",
        "chef specialty gourmet indian food",
    ]
    gallery: list[dict[str, str]] = []
    for i, term in enumerate(terms[:count]):
        photos = await search_unsplash_photos(term, count=1, orientation="landscape")
        if photos and photos[0].get("url"):
            gallery.append({
                "id": f"gal-{i+1}",
                "url": photos[0]["url"],
                "alt": photos[0].get("alt", f"{shop_name} photo {i+1}"),
                "caption": f"स्वादिष्ट व्यंजन - Fresh & Authentic",
                "tag": "Dishes" if i % 2 == 0 else "Ambiance",
            })
    return gallery
