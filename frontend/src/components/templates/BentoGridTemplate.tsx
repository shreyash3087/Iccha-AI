"use client";

import React, { useState } from "react";
import type { BusinessProfile, ProductItem } from "@/types/business";
import { getWhatsAppHref, getGoogleReviewUrl, buildWhatsAppCartMessage, Icons } from "./shared";

interface BentoGridTemplateProps {
  profile: BusinessProfile;
  cart: Record<string, number>;
  onAddToCart: (item: ProductItem) => void;
  onRemoveFromCart: (item: ProductItem) => void;
  onOpenQR: () => void;
  lang?: "hi" | "en";
}

export function BentoGridTemplate({
  profile,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onOpenQR,
  lang = "hi",
}: BentoGridTemplateProps) {
  const isEn = lang === "en";
  const brandColor = profile.primary_color || "#ff9933";
  const items = profile.products || [];

  // Group items by category if available
  const categories = Array.from(new Set(items.map((i) => i.category || (isEn ? "General" : "मुख्य"))));
  const [activeTab, setActiveTab] = useState<string>("all");

  const filteredItems = activeTab === "all" ? items : items.filter((i) => (i.category || (isEn ? "General" : "मुख्य")) === activeTab);

  const cartEntries = Object.entries(cart).filter(([, q]) => q > 0);
  const totalCount = cartEntries.reduce((s, [, q]) => s + q, 0);
  const totalPrice = cartEntries.reduce((s, [name, q]) => {
    const it = items.find((i) => i.name === name);
    return s + (it?.price || 0) * q;
  }, 0);

  const whatsappHref = getWhatsAppHref(
    profile.whatsapp,
    totalCount > 0
      ? buildWhatsAppCartMessage(profile, cart)
      : isEn
      ? `Hello! I would like to enquire about ${profile.shop_name}.`
      : `नमस्ते! मुझे ${profile.shop_name} से ऑर्डर करना है।`
  );

  const reviewUrl = getGoogleReviewUrl(profile);

  const heroImage =
    profile.header_image ||
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=85";

  // Google review highlights
  const reviews =
    profile.sections?.find((s) => s.type === "reviews")?.data?.reviews || [];
  const topReview = reviews[0] || {
    author_name: isEn ? "Satisfied Customer" : "सत्यापित ग्राहक",
    text: isEn
      ? "Best quality and authentic taste! Quick service and highly recommended."
      : "शानदार स्वाद और बेहतरीन सर्विस! यहाँ का खाना वाकई लाजवाब है।",
    rating: 5,
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-white font-sans px-4 pt-6 pb-32">
      <div className="max-w-6xl mx-auto flex flex-col gap-5">
        
        {/* ── BENTO TOP GRID ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* ── CELL 1: Brand Hero Feature (8 cols desktop, 12 mobile) ── */}
          <div className="md:col-span-8 min-h-[380px] rounded-3xl p-6 sm:p-10 flex flex-col justify-end relative overflow-hidden shadow-2xl border border-white/10 group bg-slate-950">
            {/* Background Image with Cinematic Gradient Overlay */}
            <div className="absolute inset-0 z-0">
              <img
                src={heroImage}
                alt={profile.shop_name}
                className="w-full h-full object-cover brightness-[0.35] group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-[#07090e]/60 to-transparent" />
            </div>

            {/* Ambient Brand Glow */}
            <div className="absolute -top-10 -right-10 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Content wrapper */}
            <div className="relative z-10 flex flex-col gap-3">
              {/* Top pill badges */}
              <div className="flex items-center gap-2.5 flex-wrap mb-1">
                <span className="inline-flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold text-amber-400 border border-amber-400/30 tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {profile.category?.toUpperCase() || "DIGITAL STORE"}
                </span>

                {profile.rating && (
                  <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-amber-300 border border-amber-400/30">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span>{profile.rating} ({profile.total_reviews || 0}+ {isEn ? "reviews" : "समीक्षाएं"})</span>
                  </span>
                )}
              </div>

              {/* Shop Title & Tagline */}
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                {profile.shop_name}
              </h1>

              <p className="text-sm sm:text-base text-white/80 max-w-xl leading-relaxed drop-shadow">
                {profile.tagline ||
                  (isEn
                    ? `Authentic quality and friendly service in ${profile.locality || "India"}`
                    : `${profile.locality || "आपके क्षेत्र"} का सबसे पसंदीदा और विश्वसनीय प्रतिष्ठान`)}
              </p>

              {/* Actions: WhatsApp + QR */}
              <div className="flex items-center gap-3 flex-wrap mt-2">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 px-5 py-3 rounded-2xl font-extrabold text-sm shadow-lg shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer"
                >
                  <span>{Icons.whatsapp}</span>
                  <span>{isEn ? "Order on WhatsApp" : "WhatsApp पर ऑर्डर करें"}</span>
                </a>

                <button
                  type="button"
                  onClick={onOpenQR}
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md text-white px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm cursor-pointer transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="5" height="5" x="3" y="3" rx="1" />
                    <rect width="5" height="5" x="16" y="3" rx="1" />
                    <rect width="5" height="5" x="3" y="16" rx="1" />
                    <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                    <path d="M21 21v.01" />
                  </svg>
                  <span>{isEn ? "Counter QR Standee" : "काउंटर QR स्टैंडी"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── CELL 2: Google Verified Social Proof (4 cols) ── */}
          <div className="md:col-span-4 bg-[#121724]/80 border border-white/[0.09] rounded-3xl p-6 sm:p-7 flex flex-col justify-between gap-5 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-xs font-bold text-white/70">
                  Google Reviews
                </span>
              </div>
              <div className="flex gap-0.5 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
            </div>

            {/* Review quote */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
              <p className="text-xs sm:text-sm text-white/85 italic leading-relaxed mb-3">
                &ldquo;{topReview.text}&rdquo;
              </p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                  {topReview.author_name[0]}
                </div>
                <span className="text-xs font-bold text-white">
                  {topReview.author_name}
                </span>
                <span className="text-[10px] font-bold text-emerald-400">
                  ✓ {isEn ? "Verified" : "सत्यापित"}
                </span>
              </div>
            </div>

            {/* Google Maps write review */}
            <a
              href={reviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 text-amber-400 hover:text-amber-300 text-xs font-bold transition-colors pt-1"
            >
              <span>{isEn ? "View on Google Maps" : "Google Maps पर समीक्षाएं देखें"}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>

          {/* ── CELL 3: Live Timings & Location (12 cols full-width row) ── */}
          <div className="md:col-span-12 bg-[#121724]/80 border border-white/[0.09] rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-6 backdrop-blur-xl shadow-xl">
            {/* Status Pulse */}
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-extrabold text-emerald-400">
                {isEn ? "Open Today" : "दुकान खुली है"}
              </span>
            </div>

            <div>
              <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-0.5">
                {isEn ? "Hours" : "कार्य समय"}
              </div>
              <div className="text-xs sm:text-sm font-bold text-white">
                {profile.hours?.days || "Monday - Saturday"}
              </div>
              <div className="text-xs text-white/70">
                {profile.hours?.open_time || "9:00 AM"} – {profile.hours?.close_time || "9:00 PM"}
              </div>
            </div>

            {profile.address && (
              <div className="max-w-md">
                <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-0.5">
                  {isEn ? "Address" : "पता"}
                </div>
                <div className="text-xs sm:text-sm text-white/85 leading-snug">
                  {profile.address}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── BENTO CATALOG SECTION ─────────────────────────────────── */}
        <div className="bg-[#0e121c]/75 border border-white/[0.08] rounded-3xl p-5 sm:p-8 backdrop-blur-xl shadow-2xl">
          {/* Section Header + Filter Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-4 pb-4 mb-6 border-b border-white/[0.08]">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-1">
                {isEn ? "Digital Menu & Catalog" : "हमारा डिजिटल मेनू व कैटलॉग"}
              </h2>
              <p className="text-xs text-white/55">
                {isEn ? "Select items and order instantly on WhatsApp" : "आइटम्स चुनें और WhatsApp पर तुरंत ऑर्डर भेजें"}
              </p>
            </div>

            {/* Category Filter Pills */}
            {categories.length > 1 && (
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "all"
                      ? "bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-500/20"
                      : "bg-white/[0.06] text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {isEn ? "All" : "सभी"} ({items.length})
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setActiveTab(c)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      activeTab === c
                        ? "bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-500/20"
                        : "bg-white/[0.06] text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const qty = cart[item.name] || 0;
              return (
                <div
                  key={item.name}
                  className={`rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all duration-200 bg-white/[0.025] hover:bg-white/[0.04] ${
                    qty > 0
                      ? "border-2 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/20"
                      : "border border-white/[0.08] hover:border-white/20"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-white leading-snug line-clamp-1">
                        {item.name}
                      </h3>
                      {item.unit && (
                        <span className="text-[10px] font-bold bg-white/[0.08] text-white/70 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {item.unit}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-white/55 mt-1.5 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] mt-auto">
                    <div>
                      {item.price != null ? (
                        <span className="text-sm font-black text-amber-400">
                          ₹{item.price.toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span className="text-xs text-white/50">
                          {isEn ? "Price on request" : "कीमत उपलब्ध"}
                        </span>
                      )}
                    </div>

                    {/* Stepper (+ / -) */}
                    <div className="flex items-center gap-1.5">
                      {qty > 0 ? (
                        <div className="inline-flex items-center bg-white/10 rounded-full p-0.5 gap-1">
                          <button
                            type="button"
                            onClick={() => onRemoveFromCart(item)}
                            className="w-7 h-7 rounded-full bg-white/10 text-white font-black text-xs flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors"
                          >
                            −
                          </button>
                          <span className="min-w-[20px] text-center text-xs font-black text-white">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => onAddToCart(item)}
                            className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center cursor-pointer hover:bg-amber-400 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onAddToCart(item)}
                          className="bg-white/[0.08] hover:bg-white/15 border border-white/15 text-white px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors"
                        >
                          + {isEn ? "Add" : "जोड़ें"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── FLOATING WHATSAPP CART BAR ──────────────────────────────── */}
      {totalCount > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-lg bg-[#0a180e]/95 backdrop-blur-xl border border-emerald-500 rounded-2xl p-3 sm:px-5 flex items-center justify-between shadow-2xl shadow-black/80 z-[100] gap-3">
          <div>
            <div className="text-xs font-bold text-white">
              {totalCount} {isEn ? "items selected" : "आइटम चुने गए"}
            </div>
            {totalPrice > 0 && (
              <div className="text-sm font-black text-emerald-400">
                ₹{totalPrice.toLocaleString("en-IN")}
              </div>
            )}
          </div>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm whitespace-nowrap shadow-md cursor-pointer transition-all active:scale-95"
          >
            <span>{Icons.whatsapp}</span>
            <span>{isEn ? "Send on WhatsApp" : "WhatsApp पर ऑर्डर भेजें"}</span>
          </a>
        </div>
      )}
    </div>
  );
}
