"""
Thread-safety patch for Windows libsoxr / soxr-sys in livekit_ffi.dll.

libsoxr's internal FFT cache (fft4g_cache.h / filter.c) uses non-reentrant static
global variables (lsx_fft_br, lsx_fft_sc, fft_len).
When multiple asyncio tasks or worker threads initialize, push, or flush through
livekit.rtc.AudioResampler concurrently (e.g. STT input resampler, VAD resampler,
TTS output resampler, RecorderIO), libsoxr encounters race conditions leading to:
  - 'Assertion failed! Expression: FFT_LEN == -1' on line 15 of fft4g_cache.h
  - Access violation (0xc0000005) reading 0x0000000000000000 in livekit_ffi.dll

Serializing AudioResampler lifecycle calls with a reentrant lock (RLock) eliminates
these race conditions with negligible (< 25 nanosecond) overhead.
"""

from __future__ import annotations

import logging
import threading

import livekit.rtc as rtc

logger = logging.getLogger(__name__)

_patched = False
_soxr_lock = threading.RLock()


def apply_resampler_patch() -> None:
    """Apply the reentrant lock wrapper to AudioResampler methods if not already applied."""
    global _patched
    if _patched:
        return

    orig_init = rtc.AudioResampler.__init__
    orig_push = rtc.AudioResampler.push
    orig_flush = rtc.AudioResampler.flush

    def safe_init(self: rtc.AudioResampler, *args: object, **kwargs: object) -> None:
        with _soxr_lock:
            orig_init(self, *args, **kwargs)

    def safe_push(
        self: rtc.AudioResampler, *args: object, **kwargs: object
    ) -> list[rtc.AudioFrame]:
        with _soxr_lock:
            return orig_push(self, *args, **kwargs)

    def safe_flush(
        self: rtc.AudioResampler, *args: object, **kwargs: object
    ) -> list[rtc.AudioFrame]:
        with _soxr_lock:
            return orig_flush(self, *args, **kwargs)

    rtc.AudioResampler.__init__ = safe_init  # type: ignore[method-assign]
    rtc.AudioResampler.push = safe_push  # type: ignore[method-assign]
    rtc.AudioResampler.flush = safe_flush  # type: ignore[method-assign]

    _patched = True
    logger.debug("Applied Windows libsoxr thread-safety patch to livekit.rtc.AudioResampler")
