"use client";

import React from "react";
import type { BusinessProfile } from "@/types/business";
import { getWhatsAppHref, getGoogleReviewUrl, Icons } from "../templates/shared";

interface StoreFooterProps {
  profile: BusinessProfile;
  lang?: "hi" | "en";
}

export function StoreFooter({ profile, lang = "en" }: StoreFooterProps) {
  const isEn = lang === "en";
  const whatsappHref = getWhatsAppHref(
    profile.whatsapp,
    isEn
      ? `Hello! I would like to inquire about ${profile.shop_name}.`
      : `नमस्ते! मुझे ${profile.shop_name} के बारे में जानकारी चाहिए।`
  );
  const reviewUrl = getGoogleReviewUrl(profile);

  return (
    <footer className="bg-[#fafafb] border-t border-slate-200/80 text-slate-700 py-12 px-6 sm:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-200/80">
          {/* Column 1: Brand & Bio */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0">
                {profile.shop_name.charAt(0).toUpperCase()}
              </div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                {profile.shop_name}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-4 leading-relaxed font-normal">
              {profile.tagline || (isEn ? "Authentic cuisine, warm hospitality, and unforgettable experiences in the heart of town." : "शुद्धता, स्वाद और बेहतरीन सेवा का सबसे विश्वसनीय ठिकाना।")}
            </p>
            {profile.rating && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#d97706" stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span>Google {profile.rating}★ ({profile.total_reviews || "100"}+ {isEn ? "reviews" : "समीक्षाएं"})</span>
              </div>
            )}
          </div>

          {/* Column 2: Navigation Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3.5">
              {isEn ? "Navigation" : "नेविगेशन"}
            </h4>
            <ul className="space-y-2 text-xs font-medium text-slate-600 list-none p-0 m-0">
              <li>
                <a href="#section-hero" className="hover:text-slate-950 transition-colors no-underline">
                  {isEn ? "Home" : "होम"}
                </a>
              </li>
              <li>
                <a href="#section-catalog" className="hover:text-slate-950 transition-colors no-underline">
                  {isEn ? "Signature Menu" : "हमारा मेनू"}
                </a>
              </li>
              <li>
                <a href="#section-highlights" className="hover:text-slate-950 transition-colors no-underline">
                  {isEn ? "Why Choose Us" : "हमारी खासियत"}
                </a>
              </li>
              <li>
                <a href="#section-reviews" className="hover:text-slate-950 transition-colors no-underline">
                  {isEn ? "Customer Reviews" : "ग्राहक समीक्षाएं"}
                </a>
              </li>
              <li>
                <a href="#section-contact" className="hover:text-slate-950 transition-colors no-underline">
                  {isEn ? "Hours & Location" : "समय और पता"}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Orders */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3.5">
              {isEn ? "Get In Touch" : "संपर्क"}
            </h4>
            <div className="space-y-2.5 text-xs text-slate-600 font-medium">
              {profile.address && (
                <p className="m-0 leading-relaxed text-slate-500 font-normal line-clamp-3">
                  {profile.address}
                </p>
              )}
              {profile.whatsapp && (
                <p className="m-0">
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-semibold no-underline"
                  >
                    <span>{Icons.whatsapp}</span>
                    <span>WhatsApp: {profile.whatsapp}</span>
                  </a>
                </p>
              )}
              {profile.phone && (
                <p className="m-0">
                  <a
                    href={`tel:${profile.phone}`}
                    className="inline-flex items-center gap-1.5 text-slate-700 hover:text-slate-950 no-underline"
                  >
                    <span>{Icons.phone}</span>
                    <span>Call: {profile.phone}</span>
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Attribution */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="m-0">
            &copy; {new Date().getFullYear()} {profile.shop_name}. {isEn ? "All rights reserved." : "सर्वाधिकार सुरक्षित।"}
          </p>

          <div className="flex items-center gap-4">
            <span className="text-slate-400">
              Powered by <span className="font-semibold text-slate-800">ICCHA AI</span>
            </span>
            <span className="text-slate-300">&bull;</span>
            <a
              href="#section-hero"
              className="text-slate-500 hover:text-slate-900 transition-colors no-underline font-medium inline-flex items-center gap-1"
            >
              <span>{isEn ? "Back to top" : "ऊपर जाएं"}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 15l-6-6-6 6" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
