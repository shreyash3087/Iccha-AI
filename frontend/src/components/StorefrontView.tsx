"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  useRoomContext,
} from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { fetchToken, getLiveKitUrl } from "@/lib/livekit";
import type { BusinessProfile, ProductItem } from "@/types/business";
import { Icons } from "./templates/shared";
import { CounterQRModal } from "./CounterQRModal";
import { SectionRenderer } from "./sections/SectionRenderer";
import { getCurrentUser } from "@/lib/auth";

// ────────────────────────────────────────────────────────────────────────────
// LiveKit Voice & Text Edit Assistant (Hands-Free, Autostart, No Hold Button)
// ────────────────────────────────────────────────────────────────────────────

interface LiveKitEditWidgetProps {
  slug: string;
  currentProfile: BusinessProfile;
  onProfileUpdate: (updated: BusinessProfile, summary: string) => void;
}

function LiveKitEditPanel({
  slug,
  currentProfile,
  onProfileUpdate,
  onClose,
}: {
  slug: string;
  currentProfile: BusinessProfile;
  onProfileUpdate: (updated: BusinessProfile, summary: string) => void;
  onClose: () => void;
}) {
  const room = useRoomContext();
  const { state: agentState } = useVoiceAssistant();
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [devText, setDevText] = useState("");
  const [isTextOpen, setIsTextOpen] = useState(false);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Autostart microphone immediately upon connection (Hands-free, zero hold required)
  useEffect(() => {
    if (!room) return;

    let hasPublishedInit = false;

    const initAssistant = async () => {
      if (room.state !== "connected" || !room.localParticipant) return;

      // Auto-enable microphone hands-free
      try {
        await room.localParticipant.setMicrophoneEnabled(true);
        setIsMuted(false);
      } catch (e) {
        console.warn("[LiveKit Edit] Auto-mic enable error:", e);
      }

      if (hasPublishedInit) return;
      try {
        hasPublishedInit = true;
        const msg = JSON.stringify({
          type: "EDIT_SESSION_INIT",
          profile: currentProfile,
        });
        await room.localParticipant.publishData(new TextEncoder().encode(msg), { reliable: true });
        console.log("[LiveKit Edit] Successfully published EDIT_SESSION_INIT to agent");
      } catch (e) {
        console.warn("[LiveKit Edit] Failed to publish EDIT_SESSION_INIT:", e);
      }
    };

    if (room.state === "connected") {
      void initAssistant();
    }

    room.on(RoomEvent.Connected, initAssistant);
    return () => {
      room.off(RoomEvent.Connected, initAssistant);
    };
  }, [room, currentProfile]);

  // Sync real-time updates from Python IcchaAgent over DataChannel
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);
        if (data?.type === "BUSINESS_PROFILE_UPDATE" && data.profile) {
          // GUARD: NEVER replace our valid storefront with default dummy profile!
          if (
            data.profile.shop_name === "मेरी दुकान" &&
            currentProfile.shop_name !== "मेरी दुकान"
          ) {
            console.warn("[LiveKit Edit] Ignored default dummy profile broadcast from agent");
            return;
          }
          console.log("[LiveKit Edit] Received BUSINESS_PROFILE_UPDATE:", data.profile.shop_name);
          onProfileUpdate(data.profile, "Website updated!");
          setIsProcessing(false);
        }
      } catch (err) {
        console.warn("[LiveKit Edit] DataChannel decode error:", err);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, currentProfile, onProfileUpdate]);

  // Toggle microphone mute/unmute
  const toggleMute = async () => {
    if (!room?.localParticipant || room.state !== "connected") return;
    const nextMuted = !isMuted;
    try {
      await room.localParticipant.setMicrophoneEnabled(!nextMuted);
      setIsMuted(nextMuted);
    } catch (e) {
      console.warn("[LiveKit Edit] Mute toggle error:", e);
    }
  };

  // Dev text command submission
  const handleSendDevText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const msg = devText.trim();
    if (!msg || !room?.localParticipant) return;

    setIsProcessing(true);
    setDevText("");

    try {
      const payload = new TextEncoder().encode(JSON.stringify({ type: "TEXT_INPUT", text: msg }));
      await room.localParticipant.publishData(payload, { reliable: true });
      console.log("[LiveKit Edit] Sent TEXT_INPUT command:", msg);
    } catch (err) {
      console.error("[LiveKit Edit] Failed to publish TEXT_INPUT:", err);
      setIsProcessing(false);
      return;
    }

    setTimeout(() => {
      setIsProcessing(false);
    }, 5000);
  };

  const isSpeaking = agentState === "speaking";

  return (
    <div
      id="livekit-edit-container"
      className="fixed bottom-6 right-6 z-[200] flex flex-col items-end gap-2.5 animate-fade-in select-none"
    >
      {/* Dev Text Input Drawer */}
      {isTextOpen && (
        <form
          onSubmit={handleSendDevText}
          className="bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 flex gap-2 shadow-2xl w-[340px] max-w-[calc(100vw-48px)] animate-fade-in"
        >
          <input
            ref={textInputRef}
            type="text"
            placeholder="Type change, e.g. Change price of Paneer Tikka to 290"
            value={devText}
            onChange={(e) => setDevText(e.target.value)}
            disabled={isProcessing}
            autoFocus
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-xs outline-none focus:border-amber-500 transition-colors"
          />
          <button
            type="submit"
            disabled={isProcessing || !devText.trim()}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-3.5 py-2 font-bold text-xs cursor-pointer border-0 disabled:opacity-50 transition-colors"
          >
            {isProcessing ? "..." : "Send"}
          </button>
        </form>
      )}

      {/* Main Floating Assistant Bar: Hands-Free & Autostarting */}
      <div
        className={`flex items-center gap-3 rounded-full py-2 pl-4 pr-2.5 shadow-2xl backdrop-blur-xl transition-all duration-300 border ${
          isSpeaking
            ? "bg-slate-900 text-white border-amber-500 shadow-[0_4px_25px_rgba(245,158,11,0.25)]"
            : isMuted
              ? "bg-white text-slate-800 border-slate-300 shadow-xl"
              : "bg-slate-900 text-white border-emerald-500 shadow-[0_4px_25px_rgba(16,185,129,0.25)]"
        }`}
      >
        {/* Pulsing Visualizer Indicator */}
        <div className="flex items-center gap-2.5">
          <span
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              isSpeaking
                ? "bg-amber-400 shadow-[0_0_10px_#f59e0b] animate-ping"
                : isMuted
                  ? "bg-slate-400"
                  : "bg-emerald-400 shadow-[0_0_10px_#10b981] animate-pulse"
            }`}
          />
          <span className="text-xs font-semibold select-none">
            {isProcessing
              ? "Updating website..."
              : isSpeaking
                ? "ICCHA is speaking..."
                : isMuted
                  ? "Mic paused"
                  : "Listening · Speak your changes..."}
          </span>
        </div>

        {/* Mute/Unmute Mic Toggle */}
        <button
          type="button"
          onClick={toggleMute}
          title={isMuted ? "Unmute microphone" : "Pause microphone"}
          className={`p-1.5 rounded-full border cursor-pointer transition-colors ${
            isMuted
              ? "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
              : "bg-white/10 border-white/20 text-white hover:bg-white/20"
          }`}
        >
          {isMuted ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>

        {/* Dev Text Drawer Toggle */}
        <button
          type="button"
          onClick={() => {
            setIsTextOpen((v) => !v);
            setTimeout(() => textInputRef.current?.focus(), 50);
          }}
          title="Type text command"
          className="p-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
          </svg>
        </button>

        {/* Close Assistant Session */}
        <button
          type="button"
          onClick={onClose}
          title="Close assistant"
          className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors border-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function LiveKitEditWidget({ slug, currentProfile, onProfileUpdate }: LiveKitEditWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startVoiceEdit = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const url = getLiveKitUrl();
      const { token: jwt } = await fetchToken("hi-en", slug);
      setLivekitUrl(url);
      setToken(jwt);
      setIsOpen(true);
    } catch (err) {
      console.error("Failed to connect to LiveKit voice assistant:", err);
      setErrorMessage("Microphone connection failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setToken(null);
  };

  if (isOpen && token && livekitUrl) {
    return (
      <LiveKitRoom
        token={token}
        serverUrl={livekitUrl}
        connect={true}
        audio={true}
        video={false}
        onDisconnected={handleClose}
        onError={(err) => {
          console.warn("[LiveKit Edit] Room warning/error:", err);
        }}
      >
        <RoomAudioRenderer />
        <LiveKitEditPanel
          slug={slug}
          currentProfile={currentProfile}
          onProfileUpdate={onProfileUpdate}
          onClose={handleClose}
        />
      </LiveKitRoom>
    );
  }

  return (
    <div
      id="livekit-edit-trigger"
      className="fixed bottom-7 right-6 z-[200] flex flex-col items-end gap-2"
    >
      {errorMessage && (
        <span className="bg-red-600 text-white px-2.5 py-1 rounded-lg text-xs font-semibold shadow-lg">
          {errorMessage}
        </span>
      )}

      <button
        id="voice-edit-btn"
        type="button"
        onClick={startVoiceEdit}
        disabled={isLoading}
        className="bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 rounded-full px-5 py-3 flex items-center gap-2.5 cursor-pointer shadow-2xl backdrop-blur-xl text-xs sm:text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50"
      >
        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </span>
        <span>{isLoading ? "Connecting..." : "AI se website badlein (Live Edit)"}</span>
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// StorefrontView (Single Template, Light Theme, Dedicated Store Navbar)
// ────────────────────────────────────────────────────────────────────────────

interface StorefrontViewProps {
  profile: BusinessProfile;
  slug: string;
}

const CREATOR_LANG_MAP: Record<string, string> = {
  "hi": "हिंदी",
  "hi-en": "हिंदी",
  "mr": "मराठी",
  "ta": "தமிழ்",
  "te": "తెలుగు",
  "kn": "ಕನ್ನಡ",
  "gu": "ગુજરાતી",
  "bn": "বাংলা",
  "pa": "ਪੰਜਾਬੀ",
  "ml": "മലയാളം",
};

export function StorefrontView({ profile: initialProfile, slug }: StorefrontViewProps) {
  // Ensure profile has real shop_name and sections don't hide it with 'मेरी दुकान'
  const sanitizedProfile = React.useMemo(() => {
    const p = { ...initialProfile };
    if (p.sections) {
      p.sections = p.sections.map((s) => {
        if (s.type === "hero" && (s.title === "मेरी दुकान" || s.title === "My Store" || !s.title)) {
          return { ...s, title: p.shop_name && p.shop_name !== "मेरी दुकान" ? p.shop_name : s.title };
        }
        return s;
      });
    }
    return p;
  }, [initialProfile]);

  const [profile, setProfile] = useState<BusinessProfile>(sanitizedProfile);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isQROpen, setIsQROpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // Default to English content as requested
  const [language, setLanguage] = useState<"hi" | "en">("en");
  const [creatorLangLabel, setCreatorLangLabel] = useState<string>("हिंदी");
  const [creatorLangCode, setCreatorLangCode] = useState<string>("hi");
  const [isApproving, setIsApproving] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);

  // Detect creator's chosen native language
  useEffect(() => {
    try {
      const stored = localStorage.getItem("iccha_lang") || "";
      const baseCode = stored.toLowerCase();
      if (CREATOR_LANG_MAP[baseCode]) {
        setCreatorLangLabel(CREATOR_LANG_MAP[baseCode]);
        setCreatorLangCode(baseCode);
      }
    } catch {/* ignore */}
  }, []);

  const handleProfileUpdate = useCallback((updated: BusinessProfile, summary: string) => {
    setProfile(updated);
    setToastMessage(summary);
    setTimeout(() => setToastMessage(null), 4500);

    // Asynchronously sync updated profile to Supabase database
    void fetch("/api/db/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: updated }),
    }).catch(() => {});
  }, []);

  const handleAddToCart = (item: ProductItem) =>
    setCart((prev) => ({ ...prev, [item.name]: (prev[item.name] || 0) + 1 }));

  const handleRemoveFromCart = (item: ProductItem) =>
    setCart((prev) => {
      const cur = prev[item.name] || 0;
      if (cur <= 1) { const n = { ...prev }; delete n[item.name]; return n; }
      return { ...prev, [item.name]: cur - 1 };
    });

  const handleApproveSite = async () => {
    setIsApproving(true);
    try {
      const user = await getCurrentUser();
      const updated: BusinessProfile = {
        ...profile,
        approved: true,
        approved_at: new Date().toISOString(),
        user_id: user?.id || profile.user_id,
        user_email: user?.email || profile.user_email,
      };
      setProfile(updated);

      await fetch("/api/storefronts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          slug,
          userId: user?.id,
          userEmail: user?.email,
        }),
      });

      setShowApproveModal(true);
    } catch (e) {
      console.error("Approval error:", e);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-amber-100">
      {/* ── Minimalist Merchant Preview Toolbar (No Template / Theme Distractions) ── */}
      <nav
        id="storefront-toolbar"
        aria-label="Merchant Preview Controls"
        className="bg-[#0e1117] border-b border-white/[0.08] px-4 py-2 flex items-center justify-between flex-wrap gap-2.5 sticky top-0 z-[80] shadow-md"
      >
        {/* Left: back + URL */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-white/[0.07] hover:bg-white/10 text-white px-2.5 py-1 rounded-full text-xs font-semibold no-underline transition-colors"
          >
            {Icons.arrowLeft} Back
          </Link>
          <span className="text-xs text-slate-400">
            <code className="text-amber-400 text-xs">/temp/{slug}</code>
          </span>
          <span className="bg-white/[0.06] px-2 py-0.5 rounded text-[11px] text-slate-400 uppercase font-bold tracking-wide">
            {profile.category || "Storefront"}
          </span>
        </div>

        {/* Center: Live indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Merchant Preview &bull; Single Luxury Template</span>
        </div>

        {/* Right: Approve + Dashboard + QR */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-approve-storefront"
            type="button"
            onClick={handleApproveSite}
            disabled={isApproving}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold cursor-pointer whitespace-nowrap transition-all duration-150 border ${
              profile.approved
                ? "bg-emerald-500/20 border-emerald-500/45 text-emerald-400"
                : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 border-green-500/65 text-white shadow-md shadow-green-600/30"
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {profile.approved ? "Approved" : (isApproving ? "..." : "Approve Website")}
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/10 border border-white/[0.12] text-slate-300 px-3 py-1.5 rounded-full text-xs font-semibold no-underline whitespace-nowrap transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="7" height="9" x="3" y="3" rx="1" />
              <rect width="7" height="5" x="14" y="3" rx="1" />
              <rect width="7" height="9" x="14" y="12" rx="1" />
              <rect width="7" height="5" x="3" y="16" rx="1" />
            </svg>
            Dashboard
          </Link>

          <button
            id="open-qr-standee"
            onClick={() => setIsQROpen(true)}
            className="inline-flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap transition-colors"
          >
            {Icons.camera} QR Standee
          </button>
        </div>
      </nav>

      {/* ── Single Luxury Light Theme Template ── */}
      <SectionRenderer
        profile={profile}
        cart={cart}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onOpenQR={() => setIsQROpen(true)}
        lang={language}
        onLanguageChange={setLanguage}
        creatorLangLabel={creatorLangLabel}
        creatorLangCode={creatorLangCode}
      />

      {/* ── Approval Confirmation Modal ── */}
      {showApproveModal && (
        <div
          className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowApproveModal(false);
          }}
        >
          <div className="bg-white border border-slate-200 rounded-3xl max-w-[460px] w-full p-6 sm:p-8 text-center shadow-2xl animate-scale-up">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 m-0 mb-2">
              Website Approved!
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed m-0 mb-6">
              &ldquo;{profile.shop_name}&rdquo; is approved and linked to your merchant account. You can view, manage, and inspect all your approved sites on your Merchant Dashboard.
            </p>
            <div className="flex gap-2.5 justify-center">
              <Link
                href="/dashboard"
                className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-5 rounded-xl font-bold text-sm no-underline shadow-md inline-flex items-center gap-1.5 transition-all"
              >
                Go to Dashboard
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </Link>
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 px-4.5 rounded-xl font-semibold text-sm cursor-pointer transition-colors border-0"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Standee QR Modal ── */}
      {isQROpen && (
        <CounterQRModal
          profile={profile}
          isOpen={isQROpen}
          onClose={() => setIsQROpen(false)}
        />
      )}

      {/* ── Floating Hands-Free AI Live Edit Widget ── */}
      <LiveKitEditWidget
        slug={slug}
        currentProfile={profile}
        onProfileUpdate={handleProfileUpdate}
      />

      {/* ── Real-time Update Toast ── */}
      {toastMessage && (
        <div
          id="voice-edit-toast"
          className="fixed bottom-22 right-6 z-[210] bg-slate-900 text-white border border-slate-700 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-bounce"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
