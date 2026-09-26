"""CLI runner for vision extraction from Next.js or command line."""

import asyncio
import json
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure env vars are loaded
load_dotenv(".env.local")
load_dotenv(".env")
backend_dir = Path(__file__).resolve().parent.parent.parent.parent
load_dotenv(backend_dir / ".env.local")
load_dotenv(backend_dir / ".env")

from iccha.tools.vision import extract_offerings_from_image


async def main() -> None:
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            print(json.dumps([]))
            return

        data = json.loads(raw_input)
        image_data = data.get("image", "")
        mime_type = data.get("mime_type", "image/jpeg")
        business_type = data.get("business_type", "general")

        items = await extract_offerings_from_image(
            image_data,
            mime_type=mime_type,
            business_type=business_type,
        )

        output = [it.model_dump() for it in items]
        print(json.dumps(output, ensure_ascii=False))
    except Exception as exc:
        print(json.dumps({"error": str(exc)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
