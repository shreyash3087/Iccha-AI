"""CLI runner for vision extraction from Next.js or command line."""

import asyncio
import json
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure stdout and stderr use UTF-8 on all platforms (especially Windows cp1252)
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure env vars are loaded
load_dotenv(".env.local")
load_dotenv(".env")
backend_dir = Path(__file__).resolve().parent.parent.parent.parent
load_dotenv(backend_dir / ".env.local")
load_dotenv(backend_dir / ".env")

from iccha.tools.vision import extract_offerings_from_image


async def main() -> None:
    try:
        if len(sys.argv) > 1 and Path(sys.argv[1]).exists():
            raw_input = Path(sys.argv[1]).read_text(encoding="utf-8")
        else:
            raw_input = sys.stdin.read()

        if not raw_input.strip():
            print(json.dumps([]), flush=True)
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
        json_str = json.dumps(output, ensure_ascii=False)
        try:
            print(json_str, flush=True)
        except UnicodeEncodeError:
            sys.stdout.buffer.write(json_str.encode("utf-8") + b"\n")
            sys.stdout.buffer.flush()
    except Exception as exc:
        err_obj = {"error": str(exc)}
        err_str = json.dumps(err_obj, ensure_ascii=False)
        try:
            print(err_str, file=sys.stderr, flush=True)
        except Exception:
            sys.stderr.buffer.write(err_str.encode("utf-8", errors="replace") + b"\n")
            sys.stderr.buffer.flush()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
