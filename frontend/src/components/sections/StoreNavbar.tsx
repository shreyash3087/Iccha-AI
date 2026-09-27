"use client";

import React, { useEffect, useState } from "react";
import type { BusinessProfile } from "@/types/business";
import { getWhatsAppHref, Icons } from "../templates/shared";

interface StoreNavbarProps {
  profile: BusinessProfile;
  lang: "hi" | "en";
  onLanguageChange: (newLang: "hi" | "en") => void;
  creatorLangLabel?: string;
  creatorLangCode?: string;
}

export function StoreNavbar({
  profile,
  lang,
  onLanguageChange,
  creatorLangLabel = "हिंदी",
  creatorLangCode = "hi",
}: StoreNavbarProps) {
  const isEn = lang === "en";
  const whatsappHref = getWhatsAppHref(
    profile.whatsapp,
    isEn
      ? `Hello! I would like to place an order from ${profile.shop_name}.`
      : `नमस्ते! मुझे ${profile.shop_name} से ऑर्डर करना है।`
  );

  // Trigger Google Translate cookie when toggled
  const handleToggle = (targetLang: "hi" | "en") => {
    onLanguageChange(targetLang);

    if (typeof window !== "undefined") {
      const code = targetLang === "en" ? "en" : creatorLangCode || "hi";
      // Set Google Translate cookie so browser translation kicks in if active
      document.cookie = `googtrans=/en/${code}; path=/;`;
      // Also try to trigger Google Translate select if injected
      const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
      if (select) {
        select.value = code;
        select.dispatchEvent(new Event("change"));
      }
    }
  };

  return (
    <header className="sticky top-0 z-[70] bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-colors shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Name & Icon */}
        <a
          href="#section-hero"
          className="flex items-center gap-2.5 text-inherit no-underline group"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0">
            {profile.shop_name.charAt(0).toUpperCase()}
          </div>
          <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight group-hover:text-amber-600 transition-colors truncate max-w-[200px] sm:max-w-xs">
            {profile.shop_name}
          </span>
        </a>

        {/* Center: In-page Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
          <a
            href="#section-catalog"
            className="hover:text-slate-950 transition-colors no-underline"
          >
            {isEn ? "Menu" : "मेनू"}
          </a>
          <a
            href="#section-highlights"
            className="hover:text-slate-950 transition-colors no-underline"
          >
            {isEn ? "Why Us" : "खासियत"}
          </a>
          <a
            href="#section-reviews"
            className="hover:text-slate-950 transition-colors no-underline"
          >
            {isEn ? "Reviews" : "समीक्षाएं"}
          </a>
          <a
            href="#section-contact"
            className="hover:text-slate-950 transition-colors no-underline"
          >
            {isEn ? "Hours & Location" : "समय व पता"}
          </a>
        </nav>

        {/* Right: Language Switcher & WhatsApp CTA */}
        <div className="flex items-center gap-2.5">
          {/* Language Switcher Pill */}
          <div
            id="site-lang-toggle"
            className="inline-flex bg-slate-100 p-0.5 rounded-full border border-slate-200/80"
          >
            <button
              type="button"
              onClick={() => handleToggle("en")}
              className={`rounded-full px-2.5 py-1 text-xs font-bold transition-all border-0 cursor-pointer ${
                lang === "en"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "bg-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => handleToggle("hi")}
              className={`rounded-full px-2.5 py-1 text-xs font-bold transition-all border-0 cursor-pointer ${
                lang !== "en"
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm"
                  : "bg-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              {creatorLangLabel}
            </button>
          </div>

          {/* Quick WhatsApp Action */}
          {profile.whatsapp && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs no-underline shadow-sm transition-all shrink-0"
            >
              <span className="scale-90">{Icons.whatsapp}</span>
              <span className="hidden sm:inline">{isEn ? "Order on WhatsApp" : "WhatsApp ऑर्डर"}</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
