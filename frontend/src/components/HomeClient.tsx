"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LANGUAGE_OPTIONS, type SupportedLanguage } from "@/lib/livekit";
import { HOME_TRANSLATIONS } from "@/lib/translations";
import { useAuth } from "@/context/AuthContext";
import { AppNavbar } from "@/components/AppNavbar";

const FLOATING_LANGUAGE_BADGES = [
  { code: "en" as SupportedLanguage, tag: "EN", label: "English", positionClass: "top-14 left-1 lg:left-3" },
  { code: "hi" as SupportedLanguage, tag: "HI", label: "हिन्दी", positionClass: "top-4 right-10 lg:right-16" },
  { code: "te" as SupportedLanguage, tag: "TE", label: "తెలుగు", positionClass: "top-20 -right-2 lg:right-2" },
  { code: "ta" as SupportedLanguage, tag: "TA", label: "தமிழ்", positionClass: "bottom-16 left-0 lg:left-2" },
  { code: "bn" as SupportedLanguage, tag: "BN", label: "বাংলা", positionClass: "top-36 -right-3 lg:right-0" },
  { code: "gu" as SupportedLanguage, tag: "GU", label: "ગુજરાતી", positionClass: "bottom-8 left-14 lg:left-20" },
  { code: "kn" as SupportedLanguage, tag: "KN", label: "ಕನ್ನಡ", positionClass: "bottom-8 right-6 lg:right-12" },
];

export function HomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlLang = searchParams?.get("lang") as SupportedLanguage | null;

  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(() => {
    // Priority: URL param > localStorage > English default
    if (urlLang && LANGUAGE_OPTIONS.some((l) => l.code === urlLang)) return urlLang;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("iccha_lang") as SupportedLanguage | null;
        if (stored && LANGUAGE_OPTIONS.some((l) => l.code === stored)) return stored;
      } catch {/* ignore */}
    }
    return "en";
  });

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [heroLangDropdownOpen, setHeroLangDropdownOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  // Sync state if URL param changes after initial mount
  useEffect(() => {
    if (urlLang && LANGUAGE_OPTIONS.some((l) => l.code === urlLang)) {
      setSelectedLanguage(urlLang);
    }
  }, [urlLang]);

  // NOTE: No pending-redirect check here. Auth redirects are handled exclusively
  // by /auth/callback to avoid redirect loops when the homepage is visited post-OAuth.

  // Read stored language from localStorage on initial mount if URL doesn't specify
  // (already handled in useState initializer above)

  // Close menus on outside click or ESC
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("#lang-selector-btn") && !target.closest("#lang-selector-dropdown")) {
        setLangMenuOpen(false);
      }
      if (!target.closest("#hero-lang-dropdown-btn") && !target.closest("#hero-lang-dropdown-menu")) {
        setHeroLangDropdownOpen(false);
      }
      if (!target.closest("#resources-btn") && !target.closest("#resources-dropdown")) {
        setResourcesOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLangMenuOpen(false);
        setHeroLangDropdownOpen(false);
        setResourcesOpen(false);
      }
    }
    window.addEventListener("click", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("click", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const changeLanguage = (newLang: SupportedLanguage) => {
    setSelectedLanguage(newLang);
    setLangMenuOpen(false);
    setHeroLangDropdownOpen(false);
    try {
      localStorage.setItem("iccha_lang", newLang);
      const params = new URLSearchParams(window.location.search);
      params.set("lang", newLang);
      window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
    } catch {/* ignore */}
  };

  const handleStartCall = () => {
    router.push(`/call?lang=${selectedLanguage}`);
  };

  const t = HOME_TRANSLATIONS[selectedLanguage] || HOME_TRANSLATIONS["hi-en"];
  const currentLangObj = LANGUAGE_OPTIONS.find((l) => l.code === selectedLanguage);

  return (
    <main className="min-h-screen flex flex-col items-center justify-start relative bg-[#090a10] text-white overflow-x-hidden font-sans">
      {/* ── Top Announcement Banner ── */}
      <div className="w-full bg-[#0d0e14]/90 border-b border-white/[0.06] py-1.5 px-6 sm:px-12 lg:px-20 text-center text-[11px] text-slate-300 font-medium flex items-center justify-center gap-2 relative z-50">
        <span className="text-[#fca58f] font-bold text-xs">✦</span>
        <span>
          {t.announcement}{" "}
          <span className="text-white/60">{t.announcementSub}</span>
        </span>
      </div>

      {/* ── Top Navigation Bar (Shared Unified AppNavbar) ── */}
      <AppNavbar
        selectedLang={selectedLanguage}
        onLangChange={changeLanguage}
        returnTo="/"
      />

      {/* ── HERO SECTION ── */}
      <section className="relative w-full bg-[#090a10] border-b border-white/[0.06] overflow-visible">
        {/* Background Image: homepage_hero_bg.png */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[url('/homepage_hero_bg.png')] bg-cover bg-center bg-no-repeat opacity-95" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090a10] via-[#090a10]/50 to-transparent" />
        </div>

        {/* Content Container */}
        <div className="relative max-w-6xl mx-auto px-6 sm:px-12 lg:px-20 py-6 sm:py-8 lg:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center z-10 min-h-[460px] sm:min-h-[490px]">
          {/* Left Column: Headline, Subtitle, and CTAs */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col items-start text-left">
            {/* Kicker */}
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#fca58f] sm:text-slate-400 mb-2.5 block">
              {t.eyebrow}
            </span>

            {/* Headline with soft peach-coral gradient accent */}
            <h1 className="text-2xl sm:text-3xl lg:text-[40px] xl:text-[44px] font-extrabold tracking-tight text-white leading-[1.14] mb-3">
              {t.title1}{" "}
              <br />
              <span className="bg-gradient-to-r from-[#ffe4e6] via-[#fba899] to-[#f47285] bg-clip-text text-transparent">
                {t.titleHighlight}
              </span>{" "}
              <span className="text-white">{t.title2}</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-slate-300/85 leading-relaxed max-w-md sm:max-w-lg mb-4">
              {t.subtitle}
            </p>

            {/* Vapi-style Unified Language Selector & Start Call Button */}
            <div className="flex flex-col items-start gap-1.5">
              <div className="relative inline-flex items-stretch rounded-xl bg-[#121319]/90 border border-white/15 backdrop-blur-md shadow-xl shadow-black/40">
                {/* Language Selection Field */}
                <button
                  type="button"
                  id="hero-lang-dropdown-btn"
                  onClick={() => setHeroLangDropdownOpen((v) => !v)}
                  className="flex items-center justify-between gap-2.5 px-3.5 py-2.5 min-w-[170px] sm:min-w-[200px] text-left hover:bg-white/[0.04] transition-colors rounded-l-xl cursor-pointer"
                  aria-haspopup="listbox"
                  aria-expanded={heroLangDropdownOpen}
                >
                  <span className="text-xs sm:text-sm font-medium text-white tracking-wide truncate">
                    {currentLangObj?.native}
                  </span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className={`text-slate-400 transition-transform duration-200 shrink-0 ${heroLangDropdownOpen ? "rotate-180" : ""}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {/* Vertical Divider Line with NO GAP */}
                <div className="w-px bg-white/15 my-2 shrink-0" />

                {/* Start Call Button (Navigates to /call page) */}
                <button
                  type="button"
                  id="hero-start-btn"
                  onClick={handleStartCall}
                  className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:text-[#fca58f] hover:bg-white/[0.06] active:bg-white/[0.1] active:scale-[0.99] transition-all rounded-r-xl cursor-pointer shrink-0"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-[#fca58f]">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>{t.startCall}</span>
                </button>

                {/* Upward Dropdown Menu */}
                {heroLangDropdownOpen && (
                  <div
                    id="hero-lang-dropdown-menu"
                    className="absolute bottom-[calc(100%+6px)] left-0 w-full sm:w-[250px] max-h-56 overflow-y-auto p-1 rounded-xl bg-[#13141c]/98 border border-white/15 shadow-2xl backdrop-blur-xl z-50 animate-fade-in no-scrollbar"
                  >
                    {LANGUAGE_OPTIONS.map((lang) => {
                      const isActive = selectedLanguage === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => changeLanguage(lang.code)}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                            isActive
                              ? "bg-white/10 text-white font-medium"
                              : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                          }`}
                        >
                          <span className="truncate">{lang.native}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase ml-2 shrink-0 ${
                            isActive
                              ? "bg-[#fca58f]/20 text-[#fca58f]"
                              : "text-slate-400 bg-white/5"
                          }`}>
                            {lang.tag}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mic permissions needed line */}
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 ml-0.5 select-none">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>{t.micRequired}</span>
              </p>
            </div>
          </div>

          {/* Right Column: 3D Glowing Voice Bubble with Orbiting Language Pills */}
          <div className="lg:col-span-6 xl:col-span-5 relative w-full aspect-square max-w-[380px] lg:max-w-[420px] h-[320px] sm:h-[350px] lg:h-[370px] mx-auto flex items-center justify-center">
            {/* The 3D Glass Voice Bubble Centerpiece (Click navigates to /call) */}
            <div
              onClick={handleStartCall}
              className="relative z-10 w-48 h-48 sm:w-56 sm:h-56 lg:w-[250px] lg:h-[250px] cursor-pointer group select-none flex items-center justify-center"
              title="Click to speak with ICCHA AI"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/homepage_hero_voice_bubble.png"
                alt="ICCHA AI Voice Bubble"
                className="w-full h-full object-contain filter drop-shadow-[0_16px_50px_rgba(251,168,153,0.32)] group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Orbiting Language Badges */}
            {FLOATING_LANGUAGE_BADGES.map((b) => {
              const isActive = selectedLanguage === b.code;
              return (
                <button
                  key={b.code}
                  type="button"
                  onClick={() => changeLanguage(b.code)}
                  className={`absolute ${b.positionClass} z-20 bg-[#161722]/90 hover:bg-[#1f2130] border backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1 rounded-full inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-black/40 hover:scale-105 active:scale-95 transition-all text-xs font-medium ${
                    isActive
                      ? "border-[#fca58f] bg-[#fca58f]/15 shadow-[0_0_16px_rgba(252,165,143,0.4)]"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <span
                    className={`text-[9px] sm:text-[10px] font-bold tracking-wider uppercase ${
                      isActive ? "text-[#fca58f]" : "text-slate-400"
                    }`}
                  >
                    {b.tag}
                  </span>
                  <span className="font-semibold text-[11px] sm:text-xs text-white">
                    {b.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Horizontal Stats Section ── */}
      <section
        id="stats"
        className="w-full max-w-5xl mx-auto my-3 px-6 sm:px-12 lg:px-20 py-3.5 border-y border-white/10 relative z-10"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {t.stats.languagesCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {t.stats.languagesLabel}
            </div>
          </div>

          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-[#fca58f] tracking-tight">
              {t.stats.latencyCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {t.stats.latencyLabel}
            </div>
          </div>

          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {t.stats.speedCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {t.stats.speedLabel}
            </div>
          </div>

          <div>
            <div className="text-2xl md:text-3xl font-extrabold text-emerald-400 tracking-tight">
              {t.stats.costCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {t.stats.costLabel}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works Section (Vapi Design: Bare Icons, Elegant Fonts, Subtle Shadows) ── */}
      <section
        id="how-it-works"
        className="w-full bg-white text-slate-900 py-20 sm:py-28 border-t border-slate-200/80 relative z-10"
      >
        <div className="max-w-6xl mx-auto px-6 sm:px-12 lg:px-20">
          {/* Centered Kicker & Headline matching Vapi exactly */}
          <div className="text-center max-w-3xl mx-auto mb-20 sm:mb-28">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 mb-3.5 block">
              {t.howItWorks.kicker}
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-medium tracking-[-0.03em] text-slate-900 leading-[1.18] max-w-2xl mx-auto mb-4">
              {t.howItWorks.heading}
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-normal leading-relaxed max-w-xl mx-auto">
              {t.howItWorks.subhead}
            </p>
          </div>

          {/* 3 Alternating Steps */}
          <div className="flex flex-col gap-24 sm:gap-32">
            {/* ── Step 1: Text Left, Vapi-style Card Right ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              {/* Left Column: Bare icon, Title, Smaller description */}
              <div className="lg:col-span-5 flex flex-col items-start">
                {/* Bare soundwaves icon without background box */}
                <div className="text-slate-900 mb-5">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="3" y="8" width="2.5" height="8" rx="1.25" />
                    <rect x="7.5" y="4" width="2.5" height="16" rx="1.25" />
                    <rect x="12" y="1" width="2.5" height="22" rx="1.25" />
                    <rect x="16.5" y="5" width="2.5" height="14" rx="1.25" />
                    <rect x="21" y="9" width="2.5" height="6" rx="1.25" />
                  </svg>
                </div>

                <h3 className="text-2xl sm:text-[26px] font-medium text-slate-900 tracking-tight leading-snug mb-3">
                  {t.howItWorks.step1.title}
                </h3>
                <p className="text-[13px] sm:text-sm text-slate-500 leading-relaxed font-normal max-w-md">
                  {t.howItWorks.step1.desc}
                </p>
              </div>

              {/* Right Column: Vapi Dashboard Card with Ambient Warm Glow */}
              <div className="lg:col-span-7">
                <div className="relative group">
                  {/* Ambient Glow behind the card */}
                  <div className="absolute -inset-3 bg-gradient-to-tr from-amber-600/20 via-rose-600/10 to-orange-500/20 rounded-3xl blur-2xl opacity-60 group-hover:opacity-80 transition-opacity pointer-events-none" />

                  {/* Sleek Dark Card */}
                  <div className="relative rounded-2xl bg-[#111216] border border-white/10 shadow-2xl p-4 sm:p-5 overflow-hidden">
                    {/* Card Header (Agents style) */}
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
                      <span className="text-sm font-medium text-white tracking-tight">Voice Agent Studio</span>
                      <button
                        type="button"
                        onClick={handleStartCall}
                        className="text-[11px] font-medium text-slate-200 bg-white/10 hover:bg-white/15 px-3 py-1 rounded-md transition-colors cursor-pointer"
                      >
                        Launch Call &rarr;
                      </button>
                    </div>

                    {/* Metric Tiles */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <span className="text-[10px] text-slate-400 block truncate">Total stores</span>
                        <span className="text-sm font-semibold text-white block mt-0.5">1,420+</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <span className="text-[10px] text-slate-400 block truncate">Voice latency</span>
                        <span className="text-sm font-semibold text-emerald-400 block mt-0.5">&lt; 420ms</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <span className="text-[10px] text-slate-400 block truncate">Cost/store</span>
                        <span className="text-sm font-semibold text-white block mt-0.5">₹0.00</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <span className="text-[10px] text-slate-400 block truncate">Accuracy</span>
                        <span className="text-sm font-semibold text-[#fca58f] block mt-0.5">99.2%</span>
                      </div>
                    </div>

                    {/* Active Voice Pipeline Table */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="font-medium text-slate-200">Hindi Voice Onboarding</span>
                        </div>
                        <span className="text-[10px] text-slate-400">LiveKit Audio &middot; Inbound</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="font-medium text-slate-200">Catalog Entity Extractor</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Real-time JSON &middot; Production</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="font-medium text-slate-200">Google Places Resolver</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Location API &middot; Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Step 2: Alternating (Card Left, Text Right) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              {/* Left Column: Vapi-style Card */}
              <div className="lg:col-span-7 order-2 lg:order-1">
                <div className="relative group">
                  <div className="absolute -inset-3 bg-gradient-to-tr from-indigo-600/15 via-purple-600/10 to-rose-600/15 rounded-3xl blur-2xl opacity-60 group-hover:opacity-80 transition-opacity pointer-events-none" />

                  <div className="relative rounded-2xl bg-[#111216] border border-white/10 shadow-2xl p-4 sm:p-5 overflow-hidden">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
                      <span className="text-sm font-medium text-white tracking-tight">AI Catalog Studio</span>
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Auto-Matched &middot; 4.8 &starf;
                      </span>
                    </div>

                    {/* Catalog item cards preview */}
                    <div className="grid grid-cols-3 gap-2.5 mb-3">
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between">
                        <div className="w-full h-16 rounded-lg bg-orange-950/30 border border-orange-500/20 flex items-center justify-center text-2xl mb-1.5">
                          🥗
                        </div>
                        <span className="text-xs font-medium text-white truncate">Special Poha</span>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                          <span className="text-white font-semibold">₹60</span>
                          <span className="text-[9px] text-slate-500">HD Photo</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between">
                        <div className="w-full h-16 rounded-lg bg-amber-950/30 border border-amber-500/20 flex items-center justify-center text-2xl mb-1.5">
                          🍲
                        </div>
                        <span className="text-xs font-medium text-white truncate">Dal Bafla Thali</span>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                          <span className="text-white font-semibold">₹180</span>
                          <span className="text-[9px] text-slate-500">HD Photo</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between">
                        <div className="w-full h-16 rounded-lg bg-rose-950/30 border border-rose-500/20 flex items-center justify-center text-2xl mb-1.5">
                          ☕
                        </div>
                        <span className="text-xs font-medium text-white truncate">Kulhad Chai</span>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                          <span className="text-white font-semibold">₹20</span>
                          <span className="text-[9px] text-slate-500">HD Photo</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                      <span>Categorization: Breakfast &amp; Mains</span>
                      <span className="text-slate-300 font-medium">Bento Grid Layout</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Bare icon, Title, Smaller description */}
              <div className="lg:col-span-5 order-1 lg:order-2 flex flex-col items-start">
                <div className="text-slate-900 mb-5">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                </div>

                <h3 className="text-2xl sm:text-[26px] font-medium text-slate-900 tracking-tight leading-snug mb-3">
                  {t.howItWorks.step2.title}
                </h3>
                <p className="text-[13px] sm:text-sm text-slate-500 leading-relaxed font-normal max-w-md">
                  {t.howItWorks.step2.desc}
                </p>
              </div>
            </div>

            {/* ── Step 3: Text Left, Vapi-style Card Right ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              {/* Left Column: Bare icon, Title, Smaller description */}
              <div className="lg:col-span-5 flex flex-col items-start">
                <div className="text-slate-900 mb-5">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </div>

                <h3 className="text-2xl sm:text-[26px] font-medium text-slate-900 tracking-tight leading-snug mb-3">
                  {t.howItWorks.step3.title}
                </h3>
                <p className="text-[13px] sm:text-sm text-slate-500 leading-relaxed font-normal max-w-md">
                  {t.howItWorks.step3.desc}
                </p>
              </div>

              {/* Right Column: Vapi Storefront Card */}
              <div className="lg:col-span-7">
                <div className="relative group">
                  <div className="absolute -inset-3 bg-gradient-to-tr from-emerald-600/15 via-teal-600/10 to-orange-600/15 rounded-3xl blur-2xl opacity-60 group-hover:opacity-80 transition-opacity pointer-events-none" />

                  <div className="relative rounded-2xl bg-[#111216] border border-white/10 shadow-2xl p-4 sm:p-5 overflow-hidden">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
                      <span className="text-sm font-medium text-white tracking-tight">Deploy &amp; Standee Output</span>
                      <span className="text-[10px] text-emerald-400 font-mono">Live &amp; Deployed</span>
                    </div>

                    <div className="flex items-center justify-around gap-4">
                      {/* Mobile Store Preview */}
                      <div className="w-48 bg-[#181922] border border-white/10 rounded-2xl p-3 shadow-xl flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>iccha.ai/sawariya</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        </div>
                        <div className="h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 p-1.5 flex items-center gap-2">
                          <span className="text-base">🏪</span>
                          <div className="truncate">
                            <span className="text-[10px] font-medium text-white block truncate">सवारियां रेस्टोरेंट</span>
                            <span className="text-[8px] text-slate-400">Indore &middot; Open Now</span>
                          </div>
                        </div>
                        <div className="bg-emerald-500/20 text-emerald-400 text-[10px] font-medium py-1.5 px-2 rounded-lg text-center flex items-center justify-center gap-1">
                          <span>WhatsApp Ordering</span>
                        </div>
                      </div>

                      {/* Standee Preview */}
                      <div className="w-36 bg-white rounded-xl p-3 shadow-2xl flex flex-col items-center text-center">
                        <div className="w-full bg-[#111218] text-white text-[8px] font-bold py-1 rounded mb-2 tracking-wider uppercase">
                          ICCHA AI STORE
                        </div>
                        <div className="w-16 h-16 bg-slate-900 rounded-md p-1.5 grid grid-cols-4 gap-0.5 mb-1.5">
                          <div className="bg-white rounded-xs" />
                          <div className="bg-white rounded-xs" />
                          <div className="bg-white rounded-xs" />
                          <div className="bg-transparent" />
                          <div className="bg-white rounded-xs" />
                          <div className="bg-transparent" />
                          <div className="bg-white rounded-xs" />
                          <div className="bg-white rounded-xs" />
                          <div className="bg-white rounded-xs" />
                          <div className="bg-white rounded-xs" />
                          <div className="bg-transparent" />
                          <div className="bg-white rounded-xs" />
                        </div>
                        <span className="text-[8px] font-bold text-slate-800">Scan For Menu</span>
                        <span className="text-[7px] text-slate-500">काउंटर QR स्टैंडी</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Elegant SaaS Footer ── */}
      <footer className="w-full bg-[#07080d] border-t border-white/[0.08] text-slate-400 pt-16 pb-12 relative z-10">
        <div className="max-w-6xl mx-auto px-6 sm:px-12 lg:px-20">
          {/* Top Pre-Footer Call to Action */}
          <div className="rounded-3xl bg-gradient-to-r from-[#171926] via-[#1f1b26] to-[#1a151f] border border-white/10 p-8 sm:p-10 mb-16 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#fca58f] block mb-1.5">
                {t.cta.kicker}
              </span>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-medium text-white tracking-tight">
                {t.cta.heading}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl font-normal">
                {t.cta.subhead}
              </p>
            </div>
            <button
              type="button"
              onClick={handleStartCall}
              className="shrink-0 bg-gradient-to-r from-[#fec5a7] via-[#fcb69f] to-[#f89b88] hover:from-[#fed7aa] hover:to-[#fca5a5] text-[#0d0e14] font-bold px-6 py-3 rounded-full text-xs sm:text-sm hover:opacity-95 shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>{t.cta.btn}</span>
            </button>
          </div>

          {/* 5-Column Navigation Grid */}
          <div className="grid grid-cols-2 md:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-white/[0.06]">
            {/* Col 1: Brand & Mission */}
            <div className="col-span-2 md:col-span-4 flex flex-col items-start pr-0 md:pr-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-0.5">
                  <span className="w-0.5 h-3 bg-gradient-to-t from-[#fca58f] to-rose-400 rounded-full" />
                  <span className="w-0.5 h-4.5 bg-gradient-to-t from-[#fca58f] to-rose-400 rounded-full" />
                  <span className="w-0.5 h-5 bg-gradient-to-t from-[#fca58f] to-rose-400 rounded-full" />
                  <span className="w-0.5 h-3.5 bg-gradient-to-t from-[#fca58f] to-rose-400 rounded-full" />
                  <span className="w-0.5 h-2 bg-gradient-to-t from-[#fca58f] to-rose-400 rounded-full" />
                </div>
                <span className="font-extrabold text-sm tracking-wider text-white">
                  ICCHA AI
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4 font-normal">
                {t.footer.mission}
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{t.footer.status}</span>
              </div>
            </div>

            {/* Col 2: Product */}
            <div className="md:col-span-2 flex flex-col gap-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-1">
                {t.footer.product}
              </h4>
              <a href="#how-it-works" className="text-xs text-slate-400 hover:text-white transition-colors">
                {t.nav.howItWorks}
              </a>
              <button
                type="button"
                onClick={handleStartCall}
                className="text-xs text-slate-400 hover:text-white transition-colors text-left cursor-pointer"
              >
                {t.startCall}
              </button>
              <Link href={`/dashboard?lang=${selectedLanguage}`} className="text-xs text-slate-400 hover:text-white transition-colors">
                {t.nav.merchantDashboard}
              </Link>
              <a href="#stats" className="text-xs text-slate-400 hover:text-white transition-colors">
                {t.nav.pricing}
              </a>
              <a href="/temp/2e003g6o0p22" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-white transition-colors">
                {t.nav.demoStore}
              </a>
            </div>

            {/* Col 3: Languages */}
            <div className="md:col-span-3 flex flex-col gap-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-1">
                {t.footer.languages}
              </h4>
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => changeLanguage(lang.code)}
                    className={`text-left cursor-pointer transition-colors ${
                      selectedLanguage === lang.code ? "text-[#fca58f] font-semibold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {lang.native} <span className="text-[10px] text-slate-500 font-normal">({lang.tag})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Col 4: Built for Bharat */}
            <div className="md:col-span-3 flex flex-col gap-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-1">
                {t.footer.builtFor}
              </h4>
              <span className="text-xs text-slate-400">Restaurants &amp; Cafes</span>
              <span className="text-xs text-slate-400">Kirana &amp; Grocery</span>
              <span className="text-xs text-slate-400">Boutiques &amp; Fashion</span>
              <span className="text-xs text-slate-400">Street Vendors &amp; Dhabas</span>
              <span className="text-xs text-slate-400">Sweets, Bakeries &amp; Chai</span>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>{t.footer.rights}</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span>{t.footer.powered}</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
