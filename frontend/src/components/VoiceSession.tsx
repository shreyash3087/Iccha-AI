"use client";

/**
 * VoiceSession — LiveKit room connection, multi-language interview,
 * on-screen Google Places selection, and website completion cards.
 *
 * Designed specifically for Indian small business owners:
 * - 100% responsive on mobile screens (360px - 430px) and desktop
 * - Zero emojis — uses clean, professional SVG icons throughout
 * - No premature fake website preview during the interview
 * - On-screen interactive Google Places candidate selector
 * - Camera/Photo upload for handwritten rate lists or menus
 * - Prominent storefront link and QR Standee upon completion
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
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchToken, getLiveKitUrl, LANGUAGE_OPTIONS, type SupportedLanguage } from "@/lib/livekit";
import type { BusinessProfile, BusinessProfileEvent, ProductItem } from "@/types/business";
import { StatusBadge, type AgentStatus } from "./StatusBadge";
import { WaveAnimation } from "./WaveAnimation";
import { CounterQRModal } from "./CounterQRModal";
import { AuthModal } from "./AuthModal";
import { getCurrentUser, type AuthUser } from "@/lib/auth";

// ── Status text per language ───────────────────────────────────────────────

const STATUS_TEXT: Record<SupportedLanguage, {
  speaking: string;
  listening: string;
  thinking: string;
  connecting: string;
  idle: string;
  end: string;
  start: string;
}> = {
  "hi-en": {
    speaking:    "ICCHA बोल रही है — सुनिए या बीच में बोल सकते हैं",
    listening:   "आपकी आवाज़ सुनी जा रही है...",
    thinking:    "ICCHA सोच रही है...",
    connecting:  "ICCHA से जुड़ रहे हैं...",
    idle:        "दुकान का नाम या सवाल बोलिए",
    end:         "बातचीत समाप्त करें",
    start:       "अपनी दुकान की वेबसाइट बनाएं — मुफ़्त",
  },
  hi: {
    speaking:    "ICCHA बोल रही है — सुनिए या बीच में बोल सकते हैं",
    listening:   "आपकी आवाज़ सुनी जा रही है...",
    thinking:    "ICCHA सोच रही है...",
    connecting:  "ICCHA से जुड़ रहे हैं...",
    idle:        "दुकान का नाम बोलिए",
    end:         "बातचीत समाप्त करें",
    start:       "अपनी दुकान की वेबसाइट बनाएं — मुफ़्त",
  },
  mr: {
    speaking:    "ICCHA बोलत आहे — ऐका किंवा बोला",
    listening:   "तुमचा आवाज ऐकला जात आहे...",
    thinking:    "ICCHA विचार करत आहे...",
    connecting:  "ICCHA शी जोडत आहे...",
    idle:        "तुमच्या दुकानाचे नाव सांगा",
    end:         "संभाषण संपवा",
    start:       "तुमची वेबसाइट तयार करा — मोफत",
  },
  ta: {
    speaking:    "ICCHA பேசுகிறது — கேட்கவும்",
    listening:   "உங்கள் குரல் கேட்கப்படுகிறது...",
    thinking:    "ICCHA சிந்திக்கிறது...",
    connecting:  "ICCHA உடன் இணைகிறோம்...",
    idle:        "கடையின் பெயரை சொல்லுங்கள்",
    end:         "முடிக்கவும்",
    start:       "வலைத்தளம் உருவாக்குங்கள் — இலவசம்",
  },
  te: {
    speaking:    "ICCHA మాట్లాడుతోంది — వినండి",
    listening:   "మీ గొంతు వినబడుతోంది...",
    thinking:    "ICCHA ఆలోచిస్తోంది...",
    connecting:  "ICCHA కి కనెక్ట్ అవుతోంది...",
    idle:        "మీ దుకాణం పేరు చెప్పండి",
    end:         "ముగించండి",
    start:       "మీ వెబ్‌సైట్ తయారు చేయండి",
  },
  kn: {
    speaking:    "ICCHA ಮಾತನಾಡುತ್ತಿದೆ — ಕೇಳಿ",
    listening:   "ನಿಮ್ಮ ಧ್ವನಿ ಕೇಳಲಾಗುತ್ತಿದೆ...",
    thinking:    "ICCHA ಯೋಚಿಸುತ್ತಿದೆ...",
    connecting:  "ICCHA ಗೆ ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ...",
    idle:        "ನಿಮ್ಮ ಅಂಗಡಿಯ ಹೆಸರು ಹೇಳಿ",
    end:         "ಮುಗಿಸಿ",
    start:       "ನಿಮ್ಮ ವೆಬ್‌ಸೈಟ್ ರಚಿಸಿ",
  },
  gu: {
    speaking:    "ICCHA બોલી રહ્યું છે — સાંભળો",
    listening:   "તમારો અવાજ સંભળાઈ રહ્યો છે...",
    thinking:    "ICCHA વિચારી રહ્યું છે...",
    connecting:  "ICCHA સાથે જોડાઈ રહ્યા છીએ...",
    idle:        "તમારી દુકાનનું નામ બોલો",
    end:         "સમાપ્ત કરો",
    start:       "તમારી વેબસાઇટ બનાવો — મફત",
  },
  pa: {
    speaking:    "ICCHA ਬੋਲ ਰਿਹਾ ਹੈ — ਸੁਣੋ",
    listening:   "ਤੁਹਾਡੀ ਆਵਾਜ਼ ਸੁਣੀ ਜਾ ਰਹੀ ਹੈ...",
    thinking:    "ICCHA ਸੋਚ ਰਿਹਾ ਹੈ...",
    connecting:  "ICCHA ਨਾਲ ਜੁੜ ਰਹੇ ਹਾਂ...",
    idle:        "ਆਪਣੀ ਦੁਕਾਨ ਦਾ ਨਾਮ ਦੱਸੋ",
    end:         "ਸੰਵਾਦ ਖ਼ਤਮ ਕਰੋ",
    start:       "ਆਪਣੀ ਵੈੱਬਸਾਈਟ ਬਣਾਓ — ਮੁਫ਼ਤ",
  },
  bn: {
    speaking:    "ICCHA বলছে — শুনুন বা বলুন",
    listening:   "আপনার কণ্ঠস্বর শোনা হচ্ছে...",
    thinking:    "ICCHA ভাবছে...",
    connecting:  "ICCHA এর সাথে সংযোগ হচ্ছে...",
    idle:        "আপনার দোকানের নাম বলুন",
    end:         "শেষ করুন",
    start:       "আপনার ওয়েবসাইট তৈরি করুন",
  },
  en: {
    speaking:    "ICCHA is speaking — listen or interrupt",
    listening:   "Listening to you...",
    thinking:    "ICCHA is thinking...",
    connecting:  "Connecting to ICCHA...",
    idle:        "Say your shop name to begin",
    end:         "End conversation",
    start:       "Build your store website — free",
  },
};

// ── Language Picker ────────────────────────────────────────────────────────

function LanguagePicker({
  selected,
  onSelect,
}: {
  selected: SupportedLanguage;
  onSelect: (lang: SupportedLanguage) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 w-full max-w-md">
      <div className="flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fca58f" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <p className="text-xs font-bold text-white/60 uppercase tracking-wider m-0">
          अपनी भाषा चुनें · Select Language
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center w-full">
        {LANGUAGE_OPTIONS.map((lang) => {
          const isActive = selected === lang.code;
          return (
            <button
              key={lang.code}
              id={`lang-${lang.code}`}
              type="button"
              onClick={() => onSelect(lang.code)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-all duration-150 min-h-[36px] ${
                isActive
                  ? "border-orange-500 bg-orange-500/15 text-orange-400 font-bold"
                  : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span
                className={`text-[10px] font-extrabold tracking-wider px-1.5 py-0.5 rounded ${
                  isActive ? "bg-orange-500/25 text-orange-400" : "bg-white/10 text-white/50"
                }`}
              >
                {lang.tag}
              </span>
              <span>{lang.native}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Inner voice assistant session component ──────────────────────────────

function VoiceAssistantInner({
  onDisconnect,
  language,
}: {
  onDisconnect: () => void;
  language: SupportedLanguage;
}) {
  const room = useRoomContext();
  const { state, audioTrack } = useVoiceAssistant();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [isQROpen, setIsQROpen] = useState(false);

  // Vision menu upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadToast, setUploadToast] = useState<string | null>(null);

  // Auth before preview modal state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingPreviewSlug, setPendingPreviewSlug] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    void getCurrentUser().then(setCurrentUser);
  }, []);

  // Dev-only: text input fallback (for testing without mic in public)
  const [devText, setDevText] = useState("");
  const [devInputOpen, setDevInputOpen] = useState(false);
  const devInputRef = useRef<HTMLInputElement>(null);
  const [isMicPaused, setIsMicPaused] = useState(false);

  // Automatically pause/mute mic when interview is completed so it doesn't listen infinitely
  useEffect(() => {
    if (profile?.interview_complete && room?.localParticipant) {
      void room.localParticipant.setMicrophoneEnabled(false);
      setIsMicPaused(true);
    }
  }, [profile?.interview_complete, room]);

  const handleOpenStorefrontClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!profile?.temp_slug) return;

    const user = await getCurrentUser();
    if (user) {
      if (!profile.user_id) {
        const updated = { ...profile, user_id: user.id, user_email: user.email };
        setProfile(updated);
        void fetch("/api/db/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile: updated }),
        }).catch(() => {});
      }
      window.open(`/temp/${profile.temp_slug}`, "_blank");
    } else {
      setPendingPreviewSlug(profile.temp_slug);
      setIsAuthOpen(true);
    }
  };

  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    if (profile) {
      const updated = { ...profile, user_id: user.id, user_email: user.email };
      setProfile(updated);
      void fetch("/api/db/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: updated }),
      }).catch(() => {});
    }
    const s = pendingPreviewSlug || profile?.temp_slug;
    setIsAuthOpen(false);
    if (s) {
      window.open(`/temp/${s}`, "_blank");
    }
  };

  const handleAuthClose = () => {
    setIsAuthOpen(false);
    // Strict privacy: never open preview or save draft without authentication!
  };

  const toggleMic = async () => {
    if (!room?.localParticipant) return;
    const nextState = isMicPaused; // if currently paused, enable it
    await room.localParticipant.setMicrophoneEnabled(nextState);
    setIsMicPaused(!nextState);
  };

  const sendDevText = () => {
    const msg = devText.trim();
    if (!msg || !room?.localParticipant) return;

    // Mute mic so VAD/STT detects end-of-turn immediately,
    // letting the backend's user_input generate_reply fire right away.
    void room.localParticipant.setMicrophoneEnabled(false);

    room.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify({ type: "TEXT_INPUT", text: msg })),
      { reliable: true }
    );
    setDevText("");

    // Re-enable mic after agent has had time to respond (only if not finalized)
    setTimeout(() => {
      if (!profile?.interview_complete) {
        void room.localParticipant?.setMicrophoneEnabled(true);
        setIsMicPaused(false);
      }
    }, 2500);
  };

  const txt = STATUS_TEXT[language] ?? STATUS_TEXT["hi-en"];

  // Map LiveKit agent state strings to our AgentStatus type
  const agentStatus: AgentStatus = (() => {
    switch (state) {
      case "connecting":
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
        if (data?.type === "BUSINESS_PROFILE_UPDATE" && data.profile) {
          setProfile(data.profile);
          if (data.profile.temp_slug) {
            void fetch("/api/storefronts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ profile: data.profile }),
            }).catch(() => {});
          }
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

  // Handle selecting a Google Places candidate card on-screen
  const handleSelectCandidate = (index1Based: number) => {
    if (!room?.localParticipant || !profile?.google_candidates) return;

    const chosen = profile.google_candidates[index1Based - 1];
    if (chosen) {
      // 1. Send SELECT_GOOGLE_PLACE message to agent over DataChannel
      const msg = JSON.stringify({
        type: "SELECT_GOOGLE_PLACE",
        candidate_index: index1Based,
      });
      room.localParticipant.publishData(new TextEncoder().encode(msg), { reliable: true });

      // 2. Optimistically update local profile
      setProfile({
        ...profile,
        shop_name: chosen.name,
        address: chosen.address,
        rating: chosen.rating,
        total_reviews: chosen.user_ratings_total,
        places_id: chosen.place_id,
        verified_via_places: true,
        google_candidates: [chosen],
      });
    }
  };

  // Handle rejecting all Google Places candidates
  const handleRejectCandidates = () => {
    if (!room?.localParticipant || !profile) return;

    const msg = JSON.stringify({
      type: "REJECT_GOOGLE_PLACES",
    });
    room.localParticipant.publishData(new TextEncoder().encode(msg), { reliable: true });

    setProfile({
      ...profile,
      verified_via_places: false,
      google_candidates: [],
    });
  };

  // Handle image upload & vision extraction for rate card / menu
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadToast("फोटो अपलोड हो रही है...");

    try {
      if (room?.localParticipant) {
        const startMsg = JSON.stringify({
          type: "IMAGE_UPLOAD_STARTED",
          filename: file.name,
        });
        await room.localParticipant.publishData(new TextEncoder().encode(startMsg), { reliable: true });
      }

      setUploadToast("ICCHA लिस्ट तैयार कर रही है...");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("business_type", profile?.category || "product");

      const res = await fetch("/api/vision/extract", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      const extractedItems: ProductItem[] = data.items || [];

      if (extractedItems.length > 0) {
        if (room?.localParticipant) {
          const itemsMsg = JSON.stringify({
            type: "IMAGE_ITEMS_EXTRACTED",
            items: extractedItems,
          });
          await room.localParticipant.publishData(new TextEncoder().encode(itemsMsg), { reliable: true });
        }

        if (profile) {
          setProfile({
            ...profile,
            products: [...(profile.products || []), ...extractedItems],
          });
        }

        setUploadToast(`✓ ${extractedItems.length} आइटम्स लिस्ट में जुड़ गए`);
        setTimeout(() => setUploadToast(null), 4000);
      } else {
        setUploadToast("फोटो में कोई स्पष्ट लिस्ट नहीं मिली");
        setTimeout(() => setUploadToast(null), 4000);
      }
    } catch (err) {
      console.error("[Vision Upload] Failed:", err);
      setUploadToast("फोटो अपलोड विफल रहा");
      setTimeout(() => setUploadToast(null), 4000);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const hasCandidates =
    Boolean(profile?.google_candidates && profile.google_candidates.length > 1 && !profile.verified_via_places);

  // Only show the completion card when the agent explicitly calls finalize_website
  const isComplete = Boolean(profile?.interview_complete);

  // Upload button shown only after the agent has determined the business category (step 3)
  const showUpload = Boolean(profile?.category);

  // ── When Website Creation is Complete: Show Elegant Full-Screen Launch (No Cards) ──
  if (isComplete) {
    return (
      <div className="w-full h-full max-w-2xl mx-auto flex flex-col items-center justify-center text-center px-4 animate-fade-in select-none">
        {/* Luminous Live Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold shadow-sm mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>आपकी दुकान की वेबसाइट तैयार है &middot; Storefront is Live</span>
        </div>

        {/* Large Elegant Business Name */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-slate-950 mb-2 leading-tight">
          {profile?.shop_name || "आपकी दुकान"}
        </h1>

        {/* Locality & Address */}
        <p className="text-xs sm:text-sm text-slate-500 font-normal max-w-md mx-auto line-clamp-2 mb-6">
          {profile?.address || profile?.locality || "भारत"}
        </p>

        {/* Storefront Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {profile?.products && profile.products.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>{profile.products.length} Items Listed</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>WhatsApp Ordering Ready</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="5" height="5" x="3" y="3" rx="1" />
              <rect width="5" height="5" x="16" y="3" rx="1" />
              <rect width="5" height="5" x="3" y="16" rx="1" />
            </svg>
            <span>QR Standee Ready</span>
          </span>
        </div>

        {/* Action Buttons: Clean, Elevated, Prominent */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mx-auto mb-5">
          <button
            id="open-storefront-btn"
            type="button"
            onClick={handleOpenStorefrontClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white font-semibold text-sm shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>{currentUser ? "वेबसाइट खोलें और लाइव एडिट करें" : "Google से लॉगिन कर वेबसाइट खोलें"}</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => setIsQROpen(true)}
            type="button"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="5" height="5" x="3" y="3" rx="1" />
              <rect width="5" height="5" x="16" y="3" rx="1" />
              <rect width="5" height="5" x="3" y="16" rx="1" />
              <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
            </svg>
            <span>QR कोड स्टैंडी</span>
          </button>
        </div>

        {/* Live URL Pill */}
        {profile?.temp_slug && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-500 text-xs font-mono mb-6 select-all">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>iccha.ai/temp/{profile.temp_slug}</span>
          </div>
        )}

        {/* Bottom Voice Controls for Post-Interview Edits or End */}
        <div className="flex items-center justify-center gap-4 pt-3 border-t border-slate-100 w-full max-w-sm">
          <button
            type="button"
            onClick={toggleMic}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
              isMicPaused
                ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
            </svg>
            <span>{isMicPaused ? "माइक चालू करें" : "माइक चालू है"}</span>
          </button>

          <button
            type="button"
            onClick={onDisconnect}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
            <span>बातचीत समाप्त करें</span>
          </button>
        </div>

        {/* QR Code Standee Modal */}
        {profile && (
          <CounterQRModal
            profile={profile}
            isOpen={isQROpen}
            onClose={() => setIsQROpen(false)}
          />
        )}

        {/* Google Auth Modal */}
        <AuthModal
          isOpen={isAuthOpen}
          onClose={handleAuthClose}
          onSuccess={handleAuthSuccess}
          title="Google से लॉगिन करें और वेबसाइट सुरक्षित करें"
          subtitle="लॉगिन करने से आपकी वेबसाइट सुरक्षित रहेगी और आप अपने व्यापारी डैशबोर्ड में कभी भी इसे देख, एडिट और मंज़ूर कर सकेंगे।"
          redirectAfterLogin={pendingPreviewSlug ? `/temp/${pendingPreviewSlug}` : undefined}
        />
      </div>
    );
  }

  // ── During Active Voice Conversation: Seamless Floating Interface (No Cards) ──
  return (
    <div className="w-full h-full max-w-xl mx-auto flex flex-col items-center justify-center py-2 relative my-auto">
      {/* Top subtle status pill */}
      <div className="shrink-0 flex items-center justify-center mb-6">
        <StatusBadge status={agentStatus} variant="light" />
      </div>

      {/* Center Voice Visualizer & Prompt Canvas (Zero Cards!) */}
      <div className="flex flex-col items-center justify-center w-full text-center px-2 py-2">
        {/* Dynamic Voice Visualizer Orb with Sleek Ambient Aura */}
        <div
          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center relative transition-all duration-500 ${
            isSpeaking
              ? "bg-[radial-gradient(circle,rgba(249,115,22,0.15)_0%,rgba(249,115,22,0.02)_70%,transparent_100%)] shadow-[0_0_25px_rgba(249,115,22,0.18)]"
              : isListening
                ? "bg-[radial-gradient(circle,rgba(16,185,129,0.15)_0%,rgba(16,185,129,0.02)_70%,transparent_100%)] shadow-[0_0_25px_rgba(16,185,129,0.18)]"
                : "bg-slate-50/80 shadow-none"
          }`}
        >
          {audioTrack ? (
            <BarVisualizer
              trackRef={audioTrack}
              className="w-10 h-3.5"
              barCount={5}
              options={{ minHeight: 2, maxHeight: 11 }}
            />
          ) : (
            <WaveAnimation isSpeaking={isSpeaking} isListening={isListening} />
          )}
          {isListening && <span className="pulse-ring" />}
        </div>

        {/* Clean, Humanized Prompt Typography */}
        <p
          className={`text-lg sm:text-xl font-medium tracking-tight text-center max-w-sm mt-5 mb-0 transition-colors leading-relaxed ${
            isSpeaking ? "text-[#e05638]" : "text-slate-900"
          }`}
        >
          {isSpeaking
            ? txt.speaking
            : isListening
              ? txt.listening
              : agentStatus === "thinking"
                ? txt.thinking
                : agentStatus === "connecting"
                  ? txt.connecting
                  : txt.idle}
        </p>

        {/* Google Places Candidate Selection (Clean floating list, no card borders) */}
        {hasCandidates && profile?.google_candidates && (
          <div
            id="google-places-options"
            className="w-full max-w-md bg-slate-50/90 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col gap-2 mt-4 max-h-48 overflow-y-auto no-scrollbar shadow-sm animate-fade-in text-left"
          >
            <div className="flex items-center gap-1.5 px-1">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fca58f" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <h4 className="m-0 text-xs font-semibold text-slate-800">
                Google Maps पर मिली दुकानें · अपनी दुकान चुनें:
              </h4>
            </div>

            <div className="flex flex-col gap-1.5">
              {profile.google_candidates.map((cand, idx) => (
                <button
                  key={cand.place_id || idx}
                  onClick={() => handleSelectCandidate(idx + 1)}
                  type="button"
                  className="bg-white hover:bg-orange-50/60 border border-slate-200 hover:border-orange-300 rounded-xl p-2.5 flex items-start gap-2.5 text-left cursor-pointer transition-colors shadow-none"
                >
                  <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {cand.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate leading-snug">
                      {cand.address}
                    </div>
                  </div>
                </button>
              ))}

              <button
                onClick={handleRejectCandidates}
                type="button"
                className="w-full bg-transparent hover:bg-slate-100 rounded-lg py-1.5 text-slate-400 hover:text-slate-700 text-[11px] font-medium cursor-pointer text-center transition-colors"
              >
                मेरी दुकान इनमें नहीं है (None of these)
              </button>
            </div>
          </div>
        )}

        {/* Rate card / Menu photo upload (Hidden file input) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
          id="menu-photo-upload"
        />
      </div>

      {/* Dev Text Drawer (Floats right above bottom bar if opened) */}
      {devInputOpen && (
        <div className="w-full max-w-sm flex gap-2 mb-3 animate-fade-in shrink-0">
          <input
            ref={devInputRef}
            id="dev-text-input"
            type="text"
            value={devText}
            onChange={(e) => setDevText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendDevText(); }}
            placeholder="Type your reply, press Enter..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-slate-900 text-xs outline-none focus:border-orange-500 transition-colors"
          />
          <button
            type="button"
            id="dev-text-send"
            onClick={sendDevText}
            disabled={!devText.trim()}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-4 py-2 text-xs font-medium cursor-pointer shrink-0 disabled:opacity-40 transition-colors"
          >
            Send
          </button>
        </div>
      )}

      {/* ── Bottom Control Toolbar: Floating, Minimalist, No Cards ── */}
      <div className="shrink-0 flex items-center justify-center gap-2.5 flex-wrap">
        {/* Upload menu button if category is detected */}
        {showUpload && (
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            title="मेन्यू या रेट कार्ड की फोटो अपलोड करें"
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-full text-xs font-medium cursor-pointer transition-colors disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span>{isUploading ? "फोटो पढ़ी जा रही है..." : "मेन्यू / रेट कार्ड"}</span>
          </button>
        )}

        {/* Dev Text Drawer Toggle */}
        <button
          type="button"
          id="dev-text-toggle"
          onClick={() => {
            setDevInputOpen((v) => !v);
            setTimeout(() => devInputRef.current?.focus(), 50);
          }}
          title="Type message instead of speaking"
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer ${
            devInputOpen ? "bg-slate-200 text-slate-900" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
          }`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
          </svg>
          <span>Text</span>
        </button>

        {/* End Call Button */}
        <button
          id="end-session-btn"
          type="button"
          onClick={onDisconnect}
          aria-label="End voice session"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold cursor-pointer transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
            <line x1="12" y1="2" x2="12" y2="12" />
          </svg>
          <span>{txt.end}</span>
        </button>
      </div>

      {/* QR Standee & Auth Modals */}
      {profile && (
        <CounterQRModal
          profile={profile}
          isOpen={isQROpen}
          onClose={() => setIsQROpen(false)}
        />
      )}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={handleAuthClose}
        onSuccess={handleAuthSuccess}
        title="Google से लॉगिन करें और वेबसाइट सुरक्षित करें"
        subtitle="लॉगिन करने से आपकी वेबसाइट सुरक्षित रहेगी और आप अपने व्यापारी डैशबोर्ड में कभी भी इसे देख, एडिट और मंज़ूर कर सकेंगे।"
        redirectAfterLogin={pendingPreviewSlug ? `/temp/${pendingPreviewSlug}` : undefined}
      />
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────

interface VoiceSessionProps {
  selectedLanguage?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  autoStart?: boolean;
  onClose?: () => void;
}

export function VoiceSession({ selectedLanguage, onLanguageChange, autoStart = false, onClose }: VoiceSessionProps = {}) {
  const [sessionState, setSessionState] = useState<
    "idle" | "connecting" | "connected" | "error"
  >("idle");
  const [internalLanguage, setInternalLanguage] = useState<SupportedLanguage>("hi-en");
  const language = selectedLanguage ?? internalLanguage;
  const setLanguage = (lang: SupportedLanguage) => {
    setInternalLanguage(lang);
    onLanguageChange?.(lang);
  };
  const [token, setToken] = useState<string | null>(null);
  const [livekitUrl] = useState(() => getLiveKitUrl());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const txt = STATUS_TEXT[language] ?? STATUS_TEXT["hi-en"];

  // On mount: check if there's a session ID in the URL (returning user)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("s");
    if (sid && /^[a-z0-9]{10,16}$/.test(sid)) {
      // Valid session ID in URL — user may be resuming
      setSessionId(sid);
    }
  }, []);

  const handleStart = useCallback(async () => {
    setSessionState("connecting");
    setErrorMessage(null);
    try {
      // Use existing session ID from URL if present, otherwise generate new one
      const existingSid = sessionId;
      const { token: jwt, sessionId: sid } = await fetchToken(language, existingSid ?? undefined);
      setSessionId(sid);
      setToken(jwt);
      setSessionState("connected");

      // Push session ID into URL so page can be bookmarked / revisited
      const url = new URL(window.location.href);
      url.searchParams.set("s", sid);
      window.history.replaceState({}, "", url.toString());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      setErrorMessage(msg);
      setSessionState("error");
    }
  }, [language, sessionId]);

  useEffect(() => {
    if (autoStart && sessionState === "idle" && !token) {
      handleStart();
    }
  }, [autoStart, handleStart, sessionState, token]);

  const handleDisconnect = useCallback(() => {
    setToken(null);
    setSessionState("idle");
    setErrorMessage(null);
    onClose?.();
  }, [onClose]);

  // ── Error state ─────────────────────────────────────────────────────────
  if (sessionState === "error") {
    return (
      <div className="text-center max-w-[420px] mx-auto p-6 bg-rose-50 border border-rose-200 rounded-2xl animate-fade-in">
        <div className="flex items-center justify-center gap-2 text-rose-600 mb-2 text-sm font-bold">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>कनेक्शन विफल हुआ (Connection Error)</span>
        </div>
        <p className="text-slate-600 mb-4 text-xs">
          {errorMessage}
        </p>
        <button
          id="retry-btn"
          onClick={handleStart}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-semibold cursor-pointer hover:bg-slate-800 transition-colors mx-auto"
        >
          फिर कोशिश करें (Try again)
        </button>
      </div>
    );
  }

  // ── Idle state: Language picker + Primary Start Button ──────────────────
  if (sessionState === "idle") {
    return (
      <div className="flex flex-col items-center gap-5 w-full animate-fade-in">
        <LanguagePicker selected={language} onSelect={setLanguage} />

        <button
          id="start-session-btn"
          onClick={handleStart}
          aria-label="Start voice session with ICCHA AI"
          className="min-h-[52px] px-8 py-3.5 text-sm font-extrabold inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-lg shadow-orange-500/35 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
          {txt.start}
        </button>

        {/* If a previous session ID exists in URL, show the site link */}
        {sessionId && (
          <div className="flex flex-col items-center gap-2 p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-[380px] w-full">
            <p className="m-0 text-xs text-slate-500 font-semibold uppercase tracking-wider">
              पिछला सत्र · Previous Session
            </p>
            <div className="flex gap-2.5 flex-wrap justify-center">
              <a
                href={`/temp/${sessionId}`}
                target="_blank"
                rel="noopener noreferrer"
                id="view-site-link"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-full text-orange-600 text-xs font-bold hover:bg-orange-50 transition-colors no-underline shadow-sm"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                वेबसाइट देखें
              </a>
              <button
                type="button"
                id="new-session-btn"
                onClick={() => {
                  setSessionId(null);
                  const url = new URL(window.location.href);
                  url.searchParams.delete("s");
                  window.history.replaceState({}, "", url.toString());
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-transparent border border-dashed border-slate-300 rounded-full text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer transition-colors"
              >
                नई दुकान बनाएं
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Connecting state: Spinner ───────────────────────────────────────────
  if (sessionState === "connecting") {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <StatusBadge status="connecting" variant="light" />
        <p className="text-slate-700 text-sm font-medium m-0">
          {txt.connecting}
        </p>
      </div>
    );
  }

  // ── Connected: LiveKit Room ─────────────────────────────────────────────
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
      className="w-full h-full flex flex-col items-center justify-center"
    >
      <RoomAudioRenderer />
      <div className="w-full h-full flex flex-col items-center justify-center animate-fade-in">
        <VoiceAssistantInner
          onDisconnect={handleDisconnect}
          language={language}
        />
      </div>
    </LiveKitRoom>
  );
}
