"use client";

/**
 * VoiceSession — LiveKit room connection and voice interaction UI.
 *
 * Lifecycle:
 *   1. User taps "Start" → fetchToken() mints a room JWT
 *   2. LiveKit room connects to the SFU via WebRTC
 *   3. The ICCHA agent joins (dispatched by the token's AgentDispatch)
 *   4. Bi-directional audio flows: user mic → SFU → Python agent → SFU → user
 *   5. React hooks reflect agent state: connecting → listening → speaking etc.
 *   6. User taps "End" → room disconnects, state resets
 *
 * Performance notes:
 *   - useVoiceAssistant() from @livekit/components-react handles all the
 *     LiveKit event subscription and state synchronisation. We do NOT poll.
 *   - Audio is streamed at the WebRTC layer; the React component is purely
 *     for state display and controls, not in the audio path at all.
 */

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  useRoomContext,
  BarVisualizer,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { RoomEvent } from "livekit-client";
import { useCallback, useEffect, useState } from "react";
import { fetchToken, getLiveKitUrl } from "@/lib/livekit";
import type { BusinessProfile, BusinessProfileEvent } from "@/types/business";
import { StatusBadge, type AgentStatus } from "./StatusBadge";
import { WaveAnimation } from "./WaveAnimation";
import { LiveWebsitePreview } from "./LiveWebsitePreview";

// ── Inner component (must be inside LiveKitRoom) ──────────────────────────

function VoiceAssistantInner({
  onDisconnect,
}: {
  onDisconnect: () => void;
}) {
  const room = useRoomContext();
  const { state, audioTrack } = useVoiceAssistant();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);

  // Map LiveKit agent state strings to our AgentStatus type
  const agentStatus: AgentStatus = (() => {
    switch (state) {
      case "connecting":
        return "connecting";
      case "initializing":
        return "connecting";
      case "listening":
        return "listening";
      case "thinking":
        return "thinking";
      case "speaking":
        return "speaking";
      default:
        return "idle";
    }
  })();

  const isSpeaking = agentStatus === "speaking";
  const isListening = agentStatus === "listening";

  // Listen for real-time BusinessProfile updates over LiveKit DataChannel
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const text = new TextDecoder().decode(payload);
        const data: BusinessProfileEvent = JSON.parse(text);
        if (data && data.type === "BUSINESS_PROFILE_UPDATE" && data.profile) {
          setProfile(data.profile);
        }
      } catch (err) {
        console.warn("[DataChannel] Failed to decode incoming message:", err);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: "32px",
        width: "100%",
        maxWidth: "960px",
        margin: "0 auto",
      }}
    >
      {/* ── Left panel: Voice agent controller ──────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "28px",
          width: "100%",
          maxWidth: "380px",
          flex: "1 1 320px",
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.07)",
          borderRadius: "20px",
          padding: "32px 24px",
          boxShadow: "0 12px 36px rgba(0, 0, 0, 0.35)",
        }}
      >
        {/* Status badge */}
        <StatusBadge status={agentStatus} />

        {/* Agent visualiser — circular waveform when speaking */}
        <div
          style={{
            width: 170,
            height: 170,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isSpeaking
              ? "radial-gradient(circle, rgba(255,153,51,0.12), transparent 70%)"
              : isListening
                ? "radial-gradient(circle, rgba(16,185,129,0.08), transparent 70%)"
                : "radial-gradient(circle, rgba(255,255,255,0.03), transparent 70%)",
            border: `2px solid ${
              isSpeaking
                ? "rgba(255,153,51,0.3)"
                : isListening
                  ? "rgba(16,185,129,0.2)"
                  : "rgba(255,255,255,0.08)"
            }`,
            transition: "all 0.4s ease",
            position: "relative",
          }}
        >
          {/* LiveKit BarVisualizer when we have the agent audio track */}
          {audioTrack ? (
            <BarVisualizer
              trackRef={audioTrack}
              style={{ width: 100, height: 48 }}
              barCount={7}
              options={{ minHeight: 4 }}
            />
          ) : (
            <WaveAnimation isSpeaking={isSpeaking} isListening={isListening} />
          )}

          {/* Outer pulse ring when listening */}
          {isListening && <span className="pulse-ring" />}
        </div>

        {/* Context hint text */}
        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--color-text-secondary)",
            textAlign: "center",
            lineHeight: 1.6,
            maxWidth: "300px",
          }}
        >
          {isSpeaking
            ? "ICCHA बोल रही है — रुकिए या बीच में बोल सकते हैं"
            : isListening
              ? "आपकी आवाज़ सुनी जा रही है..."
              : agentStatus === "thinking"
                ? "ICCHA सोच रही है..."
                : agentStatus === "connecting"
                  ? "ICCHA से जुड़ रहे हैं..."
                  : "कुछ भी बोलिए — Hindi या English में"}
        </p>

        {/* End call button */}
        <button
          id="end-session-btn"
          className="btn-ghost"
          onClick={onDisconnect}
          aria-label="End voice session"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
            <line x1="12" y1="2" x2="12" y2="12" />
          </svg>
          बात खत्म करें
        </button>
      </div>

      {/* ── Right panel: Live Website Preview ──────────────────────────── */}
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          flex: "1 1 380px",
        }}
      >
        <LiveWebsitePreview profile={profile} onProfileUpdate={setProfile} />
      </div>
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────

export function VoiceSession() {
  const [sessionState, setSessionState] = useState<
    "idle" | "connecting" | "connected" | "error"
  >("idle");
  const [token, setToken] = useState<string | null>(null);
  const [livekitUrl] = useState(() => getLiveKitUrl());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStart = useCallback(async () => {
    setSessionState("connecting");
    setErrorMessage(null);
    try {
      const { token: jwt } = await fetchToken();
      setToken(jwt);
      setSessionState("connected");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      setErrorMessage(msg);
      setSessionState("error");
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    setToken(null);
    setSessionState("idle");
    setErrorMessage(null);
  }, []);

  // ── Error state ─────────────────────────────────────────────────────────
  if (sessionState === "error") {
    return (
      <div
        style={{ textAlign: "center", maxWidth: 400, margin: "0 auto" }}
        className="animate-fade-in-up"
      >
        <p
          style={{
            color: "var(--color-status-error)",
            marginBottom: "16px",
            fontSize: "0.9rem",
          }}
        >
          ⚠️ {errorMessage}
        </p>
        <button
          id="retry-btn"
          className="btn-ghost"
          onClick={handleStart}
        >
          फिर कोशिश करें (Try again)
        </button>
      </div>
    );
  }

  // ── Not yet connected — show CTA ────────────────────────────────────────
  if (sessionState === "idle") {
    return (
      <button
        id="start-session-btn"
        className="btn-primary"
        onClick={handleStart}
        aria-label="Start voice session with ICCHA AI"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
        अपनी वेबसाइट बनाएं — बिल्कुल मुफ़्त
      </button>
    );
  }

  // ── Connecting spinner (token fetch in progress) ─────────────────────────
  if (sessionState === "connecting") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <StatusBadge status="connecting" />
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
          ICCHA से जुड़ रहे हैं...
        </p>
      </div>
    );
  }

  // ── Connected — render LiveKit room ─────────────────────────────────────
  return (
    <LiveKitRoom
      token={token!}
      serverUrl={livekitUrl}
      connect={true}
      audio={true}
      video={false}
      onDisconnected={handleDisconnect}
      onError={(err) => {
        console.error("[LiveKitRoom] Error:", err);
        setErrorMessage(err.message);
        setSessionState("error");
      }}
      style={{ width: "100%" }}
    >
      {/* RoomAudioRenderer handles playing the agent's TTS audio output */}
      <RoomAudioRenderer />

      <div className="animate-fade-in-up" style={{ width: "100%" }}>
        <VoiceAssistantInner onDisconnect={handleDisconnect} />
      </div>
    </LiveKitRoom>
  );
}
