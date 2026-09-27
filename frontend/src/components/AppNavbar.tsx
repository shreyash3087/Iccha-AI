"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LANGUAGE_OPTIONS, type SupportedLanguage } from "@/lib/livekit";

interface AppNavbarProps {
  /** Optional current language override */
  selectedLang?: SupportedLanguage;
  /** Optional callback when language is changed */
  onLangChange?: (lang: SupportedLanguage) => void;
  /** Return path after logging in (defaults to current page or /dashboard) */
  returnTo?: string;
}

export function AppNavbar({ selectedLang, onLangChange, returnTo }: AppNavbarProps) {
  const { user, loading, signIn, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [signingIn, setSigningIn] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(
    selectedLang || (searchParams?.get("lang") as SupportedLanguage) || "en"
  );

  useEffect(() => {
    if (selectedLang) {
      setCurrentLang(selectedLang);
    } else {
      const q = searchParams?.get("lang") as SupportedLanguage;
      if (q && LANGUAGE_OPTIONS.some((l) => l.code === q)) {
        setCurrentLang(q);
      } else {
        // Read from localStorage for persistence across pages
        try {
          const stored = localStorage.getItem("iccha_lang") as SupportedLanguage | null;
          if (stored && LANGUAGE_OPTIONS.some((l) => l.code === stored)) {
            setCurrentLang(stored);
          }
        } catch {/* ignore */}
      }
    }
  }, [selectedLang, searchParams]);

  const handleLanguageSelect = (code: SupportedLanguage) => {
    setCurrentLang(code);
    setLangMenuOpen(false);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("iccha_lang", code);
      } catch {}
    }
    if (onLangChange) {
      onLangChange(code);
    } else {
      const current = new URLSearchParams(Array.from(searchParams?.entries() || []));
      current.set("lang", code);
      router.push(`${pathname}?${current.toString()}`);
    }
  };

  const handleLogin = async () => {
    setSigningIn(true);
    const destination = returnTo ||
      (typeof window !== "undefined" ? window.location.pathname + window.location.search : "/dashboard");
    await signIn(destination);
    setSigningIn(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const currentLangObj = LANGUAGE_OPTIONS.find((l) => l.code === currentLang) || LANGUAGE_OPTIONS[1];

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between gap-4">

        {/* ── Brand mark with soundwave icon ── */}
        <Link
          href={`/?lang=${currentLang}`}
          className="flex items-center gap-2 text-inherit no-underline group shrink-0"
        >
          <div className="flex items-center gap-0.5">
            <span className="w-0.5 h-3 bg-gradient-to-t from-orange-400 to-rose-400 rounded-full" />
            <span className="w-0.5 h-4.5 bg-gradient-to-t from-orange-400 to-rose-400 rounded-full" />
            <span className="w-0.5 h-5 bg-gradient-to-t from-orange-400 to-rose-400 rounded-full" />
            <span className="w-0.5 h-3.5 bg-gradient-to-t from-orange-400 to-rose-400 rounded-full" />
            <span className="w-0.5 h-2 bg-gradient-to-t from-orange-400 to-rose-400 rounded-full" />
          </div>
          <span className="font-extrabold text-sm tracking-wider text-slate-900 group-hover:text-orange-600 transition-colors">
            ICCHA AI
          </span>
        </Link>

        {/* ── Center Nav Links (Desktop) ── */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600">
          <Link href={`/?lang=${currentLang}`} className="hover:text-slate-900 transition-colors no-underline">
            Home
          </Link>
          <a href="/#how-it-works" className="hover:text-slate-900 transition-colors no-underline">
            How it works
          </a>
          <a href="/#stats" className="hover:text-slate-900 transition-colors no-underline">
            Languages
          </a>
          <Link href={`/dashboard?lang=${currentLang}`} className="hover:text-slate-900 transition-colors no-underline">
            Dashboard
          </Link>
        </nav>

        {/* ── Right Actions: Language Selector + Auth ── */}
        <div className="flex items-center gap-2.5 relative">

          {/* Language selector dropdown pill */}
          <div className="relative">
            <button
              type="button"
              id="navbar-lang-selector-btn"
              onClick={() => setLangMenuOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-colors cursor-pointer"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span className="text-[10px] text-[#e05638] font-bold">
                {currentLangObj?.tag}
              </span>
              <span className="text-xs text-slate-800 font-medium hidden sm:inline">{currentLangObj?.native}</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {langMenuOpen && (
              <div
                id="navbar-lang-selector-dropdown"
                className="absolute top-[calc(100%+8px)] right-0 w-60 p-1.5 grid grid-cols-2 gap-1 rounded-xl bg-white border border-slate-200 shadow-2xl z-50 animate-fade-in no-scrollbar"
              >
                {LANGUAGE_OPTIONS.map((lang) => {
                  const isActive = currentLang === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguageSelect(lang.code)}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer text-left transition-colors ${
                        isActive
                          ? "bg-[#fcb69f]/20 text-[#e05638] font-bold border border-[#fca58f]/40"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <span className="text-[10px] opacity-70 min-w-[18px]">{lang.tag}</span>
                      <span className="truncate">{lang.native}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Auth: Loading / Logged In / Logged Out */}
          {loading ? (
            <div className="w-5 h-5 border-2 border-slate-200 border-t-orange-500 rounded-full animate-spin" />
          ) : user ? (
            <div className="flex items-center gap-2">
              {/* User Avatar + First Name */}
              <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold pl-1">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-extrabold text-[11px] shrink-0 shadow-xs">
                  {user.name?.[0]?.toUpperCase() || "M"}
                </div>
                <span className="max-w-[100px] truncate hidden sm:inline">
                  {user.name?.split(" ")[0] || user.email?.split("@")[0]}
                </span>
              </div>

              {/* Dashboard Link (if not already on dashboard) */}
              {pathname !== "/dashboard" && (
                <Link
                  href={`/dashboard?lang=${currentLang}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors no-underline shadow-xs"
                >
                  Dashboard
                </Link>
              )}

              {/* Sign out */}
              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs text-slate-400 hover:text-slate-700 transition-colors cursor-pointer border-0 bg-transparent px-2 py-1 rounded-lg hover:bg-slate-100"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              id="navbar-login-btn"
              type="button"
              onClick={handleLogin}
              disabled={signingIn}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer disabled:opacity-60 shadow-xs"
            >
              {signingIn ? (
                <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>{signingIn ? "Signing in..." : "Login"}</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
