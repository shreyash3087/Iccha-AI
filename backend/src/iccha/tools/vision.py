"""
Vision extraction tool for ICCHA AI.

Uses LiveKit Inference (Gemini 2.5 Flash) with multi-modal ImageContent
to extract products, services, rate cards, and menus from images (handwritten
notes, paper slips, printed boards, or menus).
"""

from __future__ import annotations

import json
import logging
import os
import re
from pathlib import Path
from typing import Any
from dotenv import load_dotenv

# Ensure credentials from .env.local are loaded if not already in environment
_backend_dir = Path(__file__).resolve().parent.parent.parent.parent
load_dotenv(_backend_dir / ".env.local")
load_dotenv(_backend_dir / ".env")

from livekit.agents import inference
from livekit.agents.llm import ChatContext, ImageContent

from iccha.models import OfferingItem

logger = logging.getLogger(__name__)

VISION_PROMPT = """\
You are an expert OCR and business catalog extractor for Indian small businesses.
You specialize in reading Indian retail price boards, handwritten notes, diary pages, \
restaurant menus, repair rate lists, salon services, and shop pamphlets (written in Hindi, English, or Hinglish).

Analyze the attached image and extract all products or services listed.
For each item, identify:
- "name": Clean name of the item or service in Hindi or English (as written)
- "price": Price in INR (number only, or null if not stated)
- "unit": Unit of measurement (e.g. "किलो", "packet", "piece", "सर्विस", "घंटा", or null)
- "item_type": Either "product" (for physical items like groceries, clothes, hardware) or "service" (for repairs, salon, tailoring, labour)
- "description": Optional short description or detail if visible

Return ONLY a valid JSON array of objects without any markdown formatting or explanations:
[
  {"name": "...", "price": 100, "unit": "kg", "item_type": "product", "description": null}
]
"""


async def extract_offerings_from_image(
    image_data: str,
    *,
    mime_type: str = "image/jpeg",
    business_type: str = "general",
    llm: inference.LLM | None = None,
) -> list[OfferingItem]:
    """
    Extract products or services from an image data URL or base64 string.

    Args:
        image_data: Image URL or data URL (e.g. 'data:image/jpeg;base64,...')
        mime_type: MIME type of the image (e.g. 'image/jpeg', 'image/png')
        business_type: Hint about business category ('retail', 'service', 'restaurant_cafe')
        llm: Optional pre-configured LLM instance

    Returns:
        List of OfferingItem instances extracted from the image.
    """
    if not image_data:
        return []

    # Ensure clean data URI if pure base64 was passed
    if not image_data.startswith("data:") and not image_data.startswith("http"):
        image_data = f"data:{mime_type};base64,{image_data}"

    active_llm = llm or inference.LLM(model="google/gemini-2.5-flash")

    chat_ctx = ChatContext()
    image_content = ImageContent(image=image_data, mime_type=mime_type)

    prompt = (
        f"{VISION_PROMPT}\n\n"
        f"Context: The business type is '{business_type}'. "
        f"Extract up to 10 prominent items/services from this image."
    )

    chat_ctx.add_message(
        role="user",
        content=[image_content, prompt],
    )

    try:
        stream = active_llm.chat(chat_ctx=chat_ctx)
        full_response = ""
        async for chunk in stream:
            if chunk.delta and chunk.delta.content:
                full_response += chunk.delta.content

        logger.info("Raw vision LLM response: %s", full_response[:300])

        # Strip markdown fences if present
        clean_json = full_response.strip()
        match = re.search(r"\[.*\]", clean_json, re.DOTALL)
        if match:
            clean_json = match.group(0)
        else:
            logger.warning("No JSON array pattern found in vision response: %s", clean_json[:200])
            return []

        try:
            data = json.loads(clean_json)
        except Exception as err:
            logger.warning("Failed to decode JSON from vision response: %s", err)
            return []

        if not isinstance(data, list):
            logger.warning("Vision response was not a JSON list: %s", clean_json[:200])
            return []

        offerings: list[OfferingItem] = []
        for item in data:
            if not isinstance(item, dict) or not item.get("name"):
                continue
            name = str(item["name"]).strip()
            price = None
            if item.get("price") is not None:
                try:
                    price = float(item["price"])
                except (ValueError, TypeError):
                    price = None

            unit = str(item.get("unit")).strip() if item.get("unit") else None
            item_type = item.get("item_type")
            if item_type not in ("product", "service"):
                item_type = "service" if "service" in business_type.lower() else "product"

            desc = str(item.get("description")).strip() if item.get("description") else None

            offerings.append(
                OfferingItem(
                    name=name,
                    price=price,
                    unit=unit,
                    item_type=item_type,
                    description=desc,
                )
            )

        logger.info("Successfully extracted %d offerings from image", len(offerings))
        return offerings

    except Exception as exc:
        logger.exception("Failed to extract offerings from image: %s", exc)
        return []
