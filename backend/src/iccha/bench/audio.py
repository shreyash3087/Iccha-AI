"""
Hindi retail test audio corpus.

Instead of requiring real microphone recordings upfront, we synthesise the
test corpus using gTTS (Google TTS, free, no API key) which supports Hindi.
Each utterance represents a realistic shop-owner response pattern:
  - Shop names (with difficult-to-pronounce Hindi/mixed words)
  - Addresses (locality names, numbers)
  - Product names with prices (common retail vocabulary)
  - Code-switched Hinglish phrases

The corpus is generated once and cached to bench_results/audio_corpus/.
Re-run with --regen-audio to recreate from scratch.

Format: List[CorpusItem] where each item has:
  - id: unique identifier
  - text: what was "spoken" (ground truth for WER)
  - language: "hi" | "hi-en" (code-switched)
  - category: "shop_name" | "address" | "product" | "general"
  - wav_path: Path to cached WAV file (generated on first run)
"""

from __future__ import annotations

import asyncio
import io
import logging
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

logger = logging.getLogger(__name__)

CORPUS_DIR = Path(__file__).parent.parent.parent.parent.parent / "bench_results" / "audio_corpus"

Category = Literal["shop_name", "address", "product", "general"]
Language = Literal["hi", "hi-en"]


@dataclass
class CorpusItem:
    id: str
    text: str
    language: Language
    category: Category
    # Normalised reference tokens for WER (lower-case, stripped punctuation)
    reference_tokens: list[str] = field(default_factory=list)
    wav_path: Path | None = None

    def __post_init__(self) -> None:
        if not self.reference_tokens:
            self.reference_tokens = _tokenize(self.text)


def _tokenize(text: str) -> list[str]:
    """Very basic normalised tokeniser for WER computation."""
    import re
    # Lower, strip punctuation except Hindi full stop (।)
    text = text.lower()
    text = re.sub(r"[।,\.\!\?\-\"\'₹]", " ", text)
    return [t for t in text.split() if t]


# ── Corpus Definition ─────────────────────────────────────────────────────────

CORPUS: list[CorpusItem] = [
    # ── Shop names ────────────────────────────────────────────────────────────
    CorpusItem(
        id="shop_001",
        text="मेरी दुकान का नाम शर्मा जनरल स्टोर है",
        language="hi",
        category="shop_name",
    ),
    CorpusItem(
        id="shop_002",
        text="Gupta Kirana Store, main market mein hai",
        language="hi-en",
        category="shop_name",
    ),
    CorpusItem(
        id="shop_003",
        text="अग्रवाल साड़ी भंडार",
        language="hi",
        category="shop_name",
    ),
    CorpusItem(
        id="shop_004",
        text="Patel Mobile Accessories, Lajpat Nagar",
        language="hi-en",
        category="shop_name",
    ),
    CorpusItem(
        id="shop_005",
        text="राम कृष्ण मेडिकल स्टोर, सेक्टर बारह",
        language="hi",
        category="shop_name",
    ),
    # ── Addresses ─────────────────────────────────────────────────────────────
    CorpusItem(
        id="addr_001",
        text="हम लाजपत नगर, नई दिल्ली में हैं",
        language="hi",
        category="address",
    ),
    CorpusItem(
        id="addr_002",
        text="Shop number teen sau pachees, Sadar Bazaar",
        language="hi-en",
        category="address",
    ),
    CorpusItem(
        id="addr_003",
        text="मुंबई में, अंधेरी वेस्ट, लिंक रोड पर",
        language="hi",
        category="address",
    ),
    # ── Products & Prices ─────────────────────────────────────────────────────
    CorpusItem(
        id="prod_001",
        text="हम चावल, दाल, आटा, और तेल बेचते हैं",
        language="hi",
        category="product",
    ),
    CorpusItem(
        id="prod_002",
        text="Basmati rice ka price hai teen sau rupaye kilo",
        language="hi-en",
        category="product",
    ),
    CorpusItem(
        id="prod_003",
        text="सरसों का तेल पाँच लीटर का डिब्बा छह सौ पचास रुपये में",
        language="hi",
        category="product",
    ),
    CorpusItem(
        id="prod_004",
        text="Ladies suits, sarees, aur lehengas milte hain yahan",
        language="hi-en",
        category="product",
    ),
    # ── General conversation ──────────────────────────────────────────────────
    CorpusItem(
        id="gen_001",
        text="हाँ, हम सोमवार से शनिवार, सुबह नौ बजे से रात नौ बजे तक खुले रहते हैं",
        language="hi",
        category="general",
    ),
    CorpusItem(
        id="gen_002",
        text="Haan, Sunday ko band rehte hain hum",
        language="hi-en",
        category="general",
    ),
    CorpusItem(
        id="gen_003",
        text="मेरा नंबर है नौ आठ सात छह पाँच चार तीन दो एक शून्य",
        language="hi",
        category="general",
    ),
]


async def ensure_corpus(regen: bool = False) -> list[CorpusItem]:
    """
    Ensure all corpus WAV files exist. Generate missing ones using gTTS.
    Returns the corpus with wav_path populated.
    """
    CORPUS_DIR.mkdir(parents=True, exist_ok=True)

    try:
        from gtts import gTTS  # type: ignore[import]
    except ImportError:
        logger.warning(
            "gTTS not installed — audio corpus cannot be generated. "
            "Run: uv add --dev gtts"
        )
        return CORPUS

    loop = asyncio.get_event_loop()

    for item in CORPUS:
        wav_path = CORPUS_DIR / f"{item.id}.wav"
        item.wav_path = wav_path

        if wav_path.exists() and not regen:
            logger.debug("Corpus item %s already cached at %s", item.id, wav_path)
            continue

        logger.info("Generating audio for corpus item %s: %s", item.id, item.text[:40])

        # gTTS is synchronous — run in thread pool
        lang = "hi" if item.language == "hi" else "hi"  # gTTS uses 'hi' for both
        mp3_buf = io.BytesIO()

        def _generate() -> bytes:
            tts = gTTS(text=item.text, lang=lang, slow=False)
            tts.write_to_fp(mp3_buf)
            return mp3_buf.getvalue()

        mp3_bytes = await loop.run_in_executor(None, _generate)

        # Convert MP3 → WAV using pydub (ffmpeg required for MP3 decode)
        # If ffmpeg not available, save as .mp3 and rename
        try:
            from pydub import AudioSegment  # type: ignore[import]
            audio = AudioSegment.from_mp3(io.BytesIO(mp3_bytes))
            # Resample to 16kHz mono (what most STT providers prefer)
            audio = audio.set_frame_rate(16000).set_channels(1)
            audio.export(str(wav_path), format="wav")
            logger.info("Saved WAV: %s (%.1fs)", wav_path.name, len(audio) / 1000)
        except Exception as e:
            # Fallback: save as MP3 with .wav extension (some STT handles it)
            logger.warning("pydub/ffmpeg failed (%s) — saving raw MP3 as .wav", e)
            wav_path.write_bytes(mp3_bytes)

        # Rate-limit gTTS to avoid 429s
        await asyncio.sleep(0.5)

    return CORPUS


def get_wav_bytes(item: CorpusItem) -> bytes | None:
    """Return raw WAV bytes for a corpus item, or None if not available."""
    if item.wav_path and item.wav_path.exists():
        return item.wav_path.read_bytes()
    return None
