"""
ICCHA AI Agent Server — entrypoint and session configuration.

This module is the process entrypoint. It:
  1. Creates the AgentServer.
  2. Defines the rtc_session handler — called once per LiveKit room job.
  3. Wires STT, TTS, and turn handling into AgentSession.
  4. Connects the agent to the room.

Separation of concerns:
  - agent.py  : IcchaAgent class (behaviour, LLM, tools)
  - server.py : AgentServer wiring (STT, TTS, VAD, turn detection, session)
  - config.py : All env / settings

Running locally:
  uv run python -m iccha.server dev

Deploying to LiveKit Cloud:
  lk agent deploy --image <image>

Pipeline configuration (Phase 1):
  STT  : AssemblyAI Universal-3.5 Pro, language=hi (Hindi)
         → chosen because it requires no extra API key in Phase 1;
           will be benchmarked against Deepgram Nova-3 and Smallest.ai Pulse
           in Phase 2 using real Hindi retail speech.
  TTS  : Cartesia Sonic-3 (voice="Indian Lady", language=hi) via LiveKit Inference
         → authentic Indian female voice matching ICCHA persona.
         Smallest.ai Lightning will also be benchmarked in Phase 2.
  Turn : MultilingualModel() — 99.4% TPR on Hindi (published benchmark).
         Dynamic endpointing (EMA-based) adapts to each caller's pause rhythm.
         min_endpointing_delay=0.3, max_endpointing_delay=5.0 as starting
         values; will be tuned in Phase 6 against real call recordings.
  VAD  : Silero — auto-supplied by AgentSession when turn_detection is set.
  Noise: DISABLED in Phase 1 — gives a clean, unmodified latency baseline.
         Will be evaluated via ai_coustics in Phase 6.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from livekit.agents import (
    AgentServer,
    AgentSession,
    JobContext,
    TurnHandlingOptions,
    cli,
    inference,
)
from livekit.plugins import smallestai
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from iccha.agent import IcchaAgent
from iccha.config import get_settings
from iccha.models import BusinessProfile, ProductItem
from iccha.prompts import get_language_prompt
from iccha.resampler_patch import apply_resampler_patch

apply_resampler_patch()

# Ensure .env.local / .env are loaded into os.environ so the LiveKit CLI worker process
# has access to LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET
load_dotenv(".env.local")
load_dotenv(".env")
backend_dir = Path(__file__).resolve().parent.parent.parent
load_dotenv(backend_dir / ".env.local")
load_dotenv(backend_dir / ".env")

logger = logging.getLogger(__name__)


def _start_health_server() -> None:
    """
    Start a minimal HTTP health-check server when running on cloud platforms
    (such as Render Web Service Free tier) that define a $PORT environment variable.
    Allows running the LiveKit worker as a free Web Service on Render ($0/mo).
    """
    port_str = os.environ.get("PORT")
    if not port_str:
        return
    try:
        from http.server import HTTPServer, BaseHTTPRequestHandler
        import threading

        port = int(port_str)

        class HealthHandler(BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(b'{"status":"ok","service":"iccha-backend"}\n')

            def log_message(self, format, *args):
                pass  # Suppress health check log spam

        httpd = HTTPServer(("0.0.0.0", port), HealthHandler)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        logger.info("Started HTTP health check server on port %d for cloud Web Service", port)
    except Exception as e:
        logger.warning("Failed to start health check server on port %s: %s", port_str, e)


_start_health_server()

# ── AgentServer ──────────────────────────────────────────────────────────────
#
# A single AgentServer instance per process. LiveKit will dispatch multiple
# concurrent rooms to the same process; each rtc_session call gets its own
# isolated AgentSession.
settings = get_settings()

# Propagate keys to os.environ so plugins that look for standard env var names find them
if settings.smallest_ai_api_key:
    os.environ["SMALLEST_API_KEY"] = settings.smallest_ai_api_key
if settings.deepgram_api_key:
    os.environ["DEEPGRAM_API_KEY"] = settings.deepgram_api_key
if settings.groq_api_key:
    os.environ["GROQ_API_KEY"] = settings.groq_api_key

server = AgentServer(
    ws_url=settings.livekit_url,
    api_key=settings.livekit_api_key,
    api_secret=settings.livekit_api_secret,
)


@server.rtc_session(agent_name=get_settings().agent_name)
async def iccha_session(ctx: JobContext) -> None:
    """
    Handle a single LiveKit room session.

    Called once per room dispatch. All state (conversation history, STT
    buffer, extracted JSON) lives inside the AgentSession and is GC'd when
    the session ends — rooms are fully isolated.
    """
    settings = get_settings()

    # Structured log context — every log line in this session will include
    # the room name, making multi-session debugging trivial.
    ctx.log_context_fields = {
        "room": ctx.room.name,
        "agent": settings.agent_name,
    }

    logger.info("Session started | room=%s", ctx.room.name)

    session = AgentSession(
        # ── STT ──────────────────────────────────────────────────────────
        # Phase 2 winner: Deepgram Nova-3 (844ms vs 3546ms for AssemblyAI)
        # Handles Hindi, English, and Hinglish code-switching with 4.2x lower latency.
        stt=inference.STT(
            model="deepgram/nova-3",
            language="multi",
        ),
        # ── TTS: Smallest.ai Lightning via persistent WebSocket streaming ─
        # Sub-100ms real-time audio chunk streaming over wss://api.smallest.ai/waves/v1/tts/live
        tts=smallestai.TTS(
            api_key=settings.smallest_ai_api_key or os.getenv("SMALLEST_API_KEY"),
            model="lightning_v3.1",
            voice_id="sunidhi",
            language="hi",
        ),
        # ── Turn Handling ─────────────────────────────────────────────────
        turn_handling=TurnHandlingOptions(
            # MultilingualModel: trained on 14 languages including Hindi.
            # Published benchmark: 99.4% TPR, 96.3% TNR on Hindi.
            # Dynamic (EMA-based) endpointing adapts to each caller's own
            # natural pause rhythm instead of a fixed silence threshold.
            turn_detection=MultilingualModel(),
            # Preemptive generation: LLM starts generating while the turn
            # detector is still deciding - saves 100-200ms on most turns.
            preemptive_generation={"enabled": True},
        ),
        # expressive=False: cleaner latency baseline; no markup overhead.
        expressive=False,
    )

    # ── Read language & sessionId ───────────────────────────────────────────
    language = "hi-en"  # default: Hinglish
    session_id: str | None = None

    # Room name is typically 'iccha-{sessionId}'
    if ctx.room.name and ctx.room.name.startswith("iccha-"):
        session_id = ctx.room.name[len("iccha-"):]

    try:
        await ctx.connect()
        for participant in ctx.room.remote_participants.values():
            meta_raw = getattr(participant, "metadata", None) or "{}"
            meta = json.loads(meta_raw)
            if "language" in meta:
                language = meta["language"]
            if "sessionId" in meta and meta["sessionId"]:
                session_id = str(meta["sessionId"])
            break
    except Exception as e:
        logger.warning("Could not read participant language metadata: %s", e)

    logger.info("Session starting | language=%s | session_id=%s | room=%s", language, session_id, ctx.room.name)

    # ── Check if an existing website profile already exists for this session ─
    loaded_profile: BusinessProfile | None = None
    is_edit_session = False

    if session_id:
        safe_sid = "".join(c for c in session_id if c.isalnum() or c in "-_")[:32]
        base_dir = Path(__file__).resolve().parent.parent.parent.parent
        possible_paths = [
            base_dir / "frontend" / "public" / "temp_sites" / f"{safe_sid}.json",
            base_dir / "backend" / "src" / "data" / "temp_sites" / f"{safe_sid}.json",
            Path.cwd() / "frontend" / "public" / "temp_sites" / f"{safe_sid}.json",
            Path.cwd() / "public" / "temp_sites" / f"{safe_sid}.json",
        ]
        for p in possible_paths:
            if p.exists():
                try:
                    loaded_data = json.loads(p.read_text(encoding="utf-8"))
                    cand_name = loaded_data.get("shop_name", "")
                    if cand_name and cand_name != "मेरी दुकान":
                        loaded_profile = BusinessProfile.model_validate(loaded_data)
                        loaded_profile.temp_slug = safe_sid
                        loaded_profile.temp_url = f"/temp/{safe_sid}"
                        loaded_profile.interview_complete = True
                        is_edit_session = True
                        logger.info("Loaded existing profile for edit session: %s (shop: %s, products: %d)", safe_sid, loaded_profile.shop_name, len(loaded_profile.products))
                        break
                except Exception as ex:
                    logger.warning("Failed to parse existing profile JSON at %s: %s", p, ex)

    agent = IcchaAgent(language=language, profile=loaded_profile, is_edit_mode=is_edit_session)
    agent._room = ctx.room

    if session_id:
        safe_sid = "".join(c for c in session_id if c.isalnum() or c in "-_")[:32]
        agent.profile.temp_slug = safe_sid
        agent.profile.temp_url = f"/temp/{safe_sid}"

    # Start the session — warms up models and connects agent to room
    await session.start(
        agent=agent,
        room=ctx.room,
    )

    # Listen for DataChannel messages from frontend (image upload notifications & extraction)
    @ctx.room.on("data_received")
    def on_data_received(dp: Any) -> None:
        try:
            raw_bytes = getattr(dp, "data", dp if isinstance(dp, (bytes, bytearray)) else None)
            if not raw_bytes:
                return
            data = json.loads(raw_bytes.decode("utf-8"))
            msg_type = data.get("type")

            if msg_type == "IMAGE_UPLOAD_STARTED":
                logger.info("Image upload started from frontend")
                session.generate_reply(
                    instructions=(
                        "The shopkeeper just uploaded an image/photo of their menu or rate list. "
                        "Acknowledge immediately in respectful Hindi using feminine grammar: "
                        "'धन्यवाद! मैं अभी इसको देखकर लिस्ट तैयार कर रही हूँ, एक सेकंड रुकिए...'"
                    )
                )

            elif msg_type == "IMAGE_ITEMS_EXTRACTED":
                items = data.get("items", [])
                logger.info("Received %d extracted items from frontend", len(items))
                if items:
                    for it in items:
                        if not isinstance(it, dict) or not it.get("name"):
                            continue
                        itype = "service" if str(it.get("item_type", "")).lower() == "service" else "product"
                        agent.profile.products.append(
                            ProductItem(
                                name=str(it["name"]).strip(),
                                price=float(it["price"]) if it.get("price") is not None else None,
                                unit=str(it["unit"]).strip() if it.get("unit") else None,
                                item_type=itype,
                                description=str(it.get("description", "")).strip() or None,
                            )
                        )
                    agent._save_temp_site()
                    asyncio.create_task(agent._broadcast_profile(room_override=ctx.room))

                    names_preview = ", ".join(it["name"] for it in items[:3])
                    session.generate_reply(
                        instructions=(
                            f"We have successfully extracted {len(items)} items from their uploaded image ({names_preview}). "
                            "In warm Hindi using feminine grammar, tell them you have added these items to their website preview, "
                            "mention two or three of the items, and ask if they want to add anything else or proceed to shop timings."
                        )
                    )

            elif msg_type == "SELECT_GOOGLE_PLACE":
                candidate_index = int(data.get("candidate_index", 1)) - 1
                logger.info("User selected Google Place candidate %d from screen", candidate_index + 1)
                candidates = agent.profile.google_candidates
                if 0 <= candidate_index < len(candidates):
                    chosen = candidates[candidate_index]
                    agent.profile.shop_name = chosen.name
                    agent.profile.address = chosen.address
                    agent.profile.rating = chosen.rating
                    agent.profile.total_reviews = chosen.user_ratings_total
                    agent.profile.places_id = chosen.place_id
                    agent.profile.verified_via_places = True
                    agent.profile.google_candidates = [chosen]
                    agent.profile.update_temp_slug(force=True)
                    agent._save_temp_site()
                    asyncio.create_task(agent._broadcast_profile(room_override=ctx.room))

                    session.generate_reply(
                        instructions=(
                            f"The shopkeeper clicked and selected '{chosen.name}' ({chosen.address}) from the screen. "
                            f"Rating is {chosen.rating or 'good'}. "
                            "In warm Hindi using feminine grammar, acknowledge their screen selection: "
                            f"'बहुत बढ़िया! मैंने आपकी दुकान {chosen.name} चुन ली है।' "
                            "Then ask them what products or services they sell (Step 3)."
                        )
                    )

            elif msg_type == "REJECT_GOOGLE_PLACES":
                logger.info("User indicated none of the Google candidates match their shop")
                agent.profile.verified_via_places = False
                agent.profile.wants_google_review_help = True
                agent.profile.google_candidates = []
                agent._save_temp_site()
                asyncio.create_task(agent._broadcast_profile(room_override=ctx.room))
                session.generate_reply(
                    instructions=(
                        "The shopkeeper clicked that none of the suggested Google Maps listings are their shop. "
                        "Reassure them warmly in Hindi using feminine grammar that it is no problem at all, "
                        "we will set up a fresh Google Review page for them! "
                        "Then ask what products or services they sell (Step 3)."
                    )
                )

            elif msg_type == "TEXT_INPUT":
                user_text = str(data.get("text", "")).strip()
                if user_text:
                    logger.info("Dev TEXT_INPUT received: %r", user_text)
                    if is_edit_session or getattr(agent, "is_edit_mode", False) or (agent.profile and agent.profile.interview_complete):
                        session.generate_reply(
                            user_input=user_text,
                            instructions=(
                                f"The merchant sent this live website edit request: '{user_text}'. "
                                "You MUST execute the corresponding tool call immediately: "
                                "- If adding a section (reviews, testimonials, google reviews): call `add_section(section_type='reviews')` "
                                "- If adding photo gallery: call `add_section(section_type='gallery')` "
                                "- If adding about us / story: call `add_section(section_type='story')` "
                                "- If adding trust badges / highlights: call `add_section(section_type='highlights')` "
                                "- If adding offers or discount banner: call `add_section(section_type='offers')` "
                                "- If adding FAQ: call `add_section(section_type='faq')` "
                                "- If adding photos to items or improving visuals: call `auto_populate_images()` "
                                "- If updating a product photo: call `set_product_image(product_name=..., query_or_url=...)` "
                                "- If updating hero background / cover image: call `set_hero_image(query_or_url=...)` "
                                "- If removing any section (e.g. reviews, gallery): call `remove_section(section_type=...)` "
                                "- If changing color or theme (e.g. maroon, blue, dark, etc.): call `update_storefront_style(primary_color=...)` "
                                "- If changing template or layout design: call `update_storefront_style(template_id=...)` "
                                "- If removing a product or service: call `remove_product(product_name=...)` "
                                "- If changing price or unit: call `update_product_price(product_name=..., new_price=...)` "
                                "- If adding a product or service: call `add_product(name=..., price=..., item_type=...)` "
                                "- If changing timings, phone, WhatsApp, shop name, or address: call `update_business_info(...)` "
                                "NEVER say you made a change without calling the tool! The screen only updates when the tool executes. "
                                "After executing the tool call, confirm the change to the merchant in 1 concise, pleasant sentence in Hindi/Hinglish."
                            )
                        )
                    else:
                        session.generate_reply(user_input=user_text)

            elif msg_type == "SCREENSHOT_CONTEXT":
                logger.info("Screenshot visual context received from client DataChannel")
                # Visual context notification for current turn

            elif msg_type == "EDIT_SESSION_INIT":
                logger.info("Received EDIT_SESSION_INIT from client storefront")
                client_profile = data.get("profile")
                if client_profile and isinstance(client_profile, dict):
                    client_shop = client_profile.get("shop_name")
                    if client_shop and client_shop != "मेरी दुकान":
                        agent.profile = BusinessProfile.model_validate(client_profile)
                        agent.profile.interview_complete = True
                        agent.is_edit_mode = True
                        agent._save_temp_site()
                        logger.info("Synchronized profile from client EDIT_SESSION_INIT: %s", agent.profile.shop_name)

        except Exception as err:
            logger.warning("Error processing incoming DataChannel packet: %s", err)


    # Broadcast initial profile so frontend is immediately synchronized
    await agent._broadcast_profile(room_override=ctx.room)

    # Immediately greet the caller based on mode (edit vs new creation)
    if is_edit_session and agent.profile and agent.profile.shop_name != "मेरी दुकान":
        session.generate_reply(
            instructions=(
                f"The merchant is currently viewing and editing their live website for '{agent.profile.shop_name}'. "
                f"In their selected language ({language}), greet them warmly. "
                f"Say that their website for '{agent.profile.shop_name}' is live and ask what updates they would like to make "
                "(for example: changing colors/theme, adding or removing items, updating prices, or picking another design template). "
                "CRITICAL INSTRUCTION: DO NOT ask them for their shop name, address, or basic details again! Their website is already built!"
            )
        )
    else:
        session.generate_reply(
            instructions=(
                f"Greet the shopkeeper warmly according to their selected language ({language}), "
                "introduce yourself as ICCHA AI, and ask what the name of their shop is."
            )
        )


if __name__ == "__main__":
    cli.run_app(server)
