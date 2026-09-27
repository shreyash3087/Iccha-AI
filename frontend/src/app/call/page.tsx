"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { VoiceSession } from "@/components/VoiceSession";
import { LANGUAGE_OPTIONS, type SupportedLanguage } from "@/lib/livekit";

function CallPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlLang = searchParams.get("lang") as SupportedLanguage | null;

  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(
    urlLang && LANGUAGE_OPTIONS.some((l) => l.code === urlLang)
      ? urlLang
      : "hi-en"
  );
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  // Sync state if URL changes
  useEffect(() => {
    if (urlLang && LANGUAGE_OPTIONS.some((l) => l.code === urlLang)) {
      setSelectedLanguage(urlLang);
    }
  }, [urlLang]);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setSelectedLanguage(newLang);
    setLangMenuOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", newLang);
    router.replace(`/call?${params.toString()}`);
  };

  const currentLangObj = LANGUAGE_OPTIONS.find((l) => l.code === selectedLanguage);

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-white text-slate-900 flex flex-col justify-between font-sans antialiased selection:bg-[#fcb69f]/30">
      {/* ── Top Navigation Bar: Slim, Minimalist, No Clutter ── */}
      <header className="h-14 shrink-0 px-6 sm:px-12 flex items-center justify-between border-b border-slate-100 bg-white z-20">
        {/* Back to Home & Logo */}
        <div className="flex items-center gap-6">
          <Link
            href={`/?lang=${selectedLanguage}`}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-900 transition-colors no-underline group"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="group-hover:-translate-x-0.5 transition-transform"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to home</span>
          </Link>

          <div className="h-4 w-px bg-slate-200" />

          {/* Brand Mark */}
          <Link
            href={`/?lang=${selectedLanguage}`}
            className="flex items-center gap-2 text-inherit no-underline"
          >
            <div className="flex items-center gap-0.5">
              <span className="w-0.5 h-3 bg-gradient-to-t from-[#fca58f] to-rose-400 rounded-full" />
              <span className="w-0.5 h-4.5 bg-gradient-to-t from-[#fca58f] to-rose-400 rounded-full" />
              <span className="w-0.5 h-5 bg-gradient-to-t from-[#fca58f] to-rose-400 rounded-full" />
              <span className="w-0.5 h-3.5 bg-gradient-to-t from-[#fca58f] to-rose-400 rounded-full" />
              <span className="w-0.5 h-2 bg-gradient-to-t from-[#fca58f] to-rose-400 rounded-full" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-slate-900">
              ICCHA AI
            </span>
          </Link>
        </div>

        {/* Right Actions: Live Engine Status & Language Switcher */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-[11px] font-medium text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Voice Assistant Active</span>
          </div>

          {/* Language Selector Pill */}
          <div className="relative">
            <button
              type="button"
              id="call-lang-btn"
              onClick={() => setLangMenuOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-colors cursor-pointer"
            >
              <span className="text-[10px] text-[#e05638] font-bold">
                {currentLangObj?.tag}
              </span>
              <span className="text-xs text-slate-800 font-medium">
                {currentLangObj?.native}
              </span>
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className={`transition-transform ${langMenuOpen ? "rotate-180" : ""}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {langMenuOpen && (
              <div
                id="call-lang-dropdown"
                className="absolute top-[calc(100%+8px)] right-0 w-60 p-1.5 grid grid-cols-2 gap-1 rounded-xl bg-white border border-slate-200 shadow-2xl z-50 animate-fade-in no-scrollbar"
              >
                {LANGUAGE_OPTIONS.map((lang) => {
                  const isActive = selectedLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer text-left transition-colors ${
                        isActive
                          ? "bg-[#fcb69f]/20 text-[#e05638] font-bold border border-[#fca58f]/40"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <span className="text-[10px] opacity-70 min-w-[18px]">
                        {lang.tag}
                      </span>
                      <span className="truncate">{lang.native}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Canvas: Full Screen, Zero Cards, Fits in h-screen ── */}
      <main className="flex-1 w-full max-w-4xl mx-auto flex flex-col items-center justify-center px-4 py-4 overflow-hidden relative">
        {/* Subtle Ambient Background Accents */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-orange-50/50 via-rose-50/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <VoiceSession
          selectedLanguage={selectedLanguage}
          onLanguageChange={handleLanguageChange}
          autoStart={true}
          onClose={() => router.push(`/?lang=${selectedLanguage}`)}
        />
      </main>

      {/* ── Minimal Bottom Safe Bar ── */}
      <footer className="h-9 shrink-0 flex items-center justify-center text-[11px] text-slate-400 z-10 select-none">
        Speak naturally in your mother tongue &middot; ICCHA creates your website automatically
      </footer>
    </div>
  );
}

export default function CallPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen bg-white flex items-center justify-center text-sm text-slate-500">
          Loading voice assistant...
        </div>
      }
    >
      <CallPageInner />
    </Suspense>
  );
}
