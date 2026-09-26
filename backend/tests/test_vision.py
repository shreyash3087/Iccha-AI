"""
Unit tests for vision extraction tool (backend/src/iccha/tools/vision.py).
"""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock

import pytest

from iccha.models import OfferingItem
from iccha.tools.vision import extract_offerings_from_image


class DummyChunk:
    def __init__(self, content: str):
        self.delta = MagicMock(content=content)


@pytest.mark.asyncio
async def test_extract_offerings_from_image_empty():
    res = await extract_offerings_from_image("")
    assert res == []


@pytest.mark.asyncio
async def test_extract_offerings_from_image_mock():
    mock_llm = MagicMock()

    mock_json = json.dumps([
        {"name": "मोबाईल स्क्रीन रिपेयर", "price": 1200, "unit": "सर्विस", "item_type": "service"},
        {"name": "टेम्पर्ड ग्लास", "price": 100, "unit": "पीस", "item_type": "product"},
    ])

    async def mock_stream():
        yield DummyChunk(f"```json\n{mock_json}\n```")

    mock_llm.chat.return_value = mock_stream()

    items = await extract_offerings_from_image(
        "data:image/jpeg;base64,fakeimage",
        business_type="service",
        llm=mock_llm,
    )

    assert len(items) == 2
    assert items[0].name == "मोबाईल स्क्रीन रिपेयर"
    assert items[0].price == 1200.0
    assert items[0].item_type == "service"
    assert items[1].name == "टेम्पर्ड ग्लास"
    assert items[1].price == 100.0
    assert items[1].item_type == "product"
