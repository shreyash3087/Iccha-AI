"use client";

import React, { useState } from "react";
import type { BusinessProfile, ProductItem } from "@/types/business";
import { getWhatsAppHref, getGoogleReviewUrl, buildWhatsAppCartMessage, Icons } from "./shared";

interface RoyalLuxuryTemplateProps {
  profile: BusinessProfile;
  cart: Record<string, number>;
  onAddToCart: (item: ProductItem) => void;
  onRemoveFromCart: (item: ProductItem) => void;
  onOpenQR: () => void;
  lang?: "hi" | "en";
}

export function RoyalLuxuryTemplate({
  profile,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onOpenQR,
  lang = "hi",
}: RoyalLuxuryTemplateProps) {
  const isEn = lang === "en";
  const items = profile.products || [];

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
      ? `Greetings. I would like to place an order from ${profile.shop_name}.`
      : `नमस्ते। मुझे ${profile.shop_name} से ऑर्डर बुक करना है।`
  );

  const reviewUrl = getGoogleReviewUrl(profile);
  const heroImage =
    profile.header_image ||
    "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1600&q=85";

  return (
    <div className="min-h-screen bg-[#07070a] text-stone-100 font-serif pb-32">
      {/* ── LUXURY HERO HEADER ────────────────────────────────────────── */}
      <header className="relative min-h-[460px] flex items-center justify-center text-center px-6 py-16 border-b border-amber-500/20 overflow-hidden bg-[#07070a]">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt={profile.shop_name}
            className="w-full h-full object-cover brightness-[0.28] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#07070a]/60 via-[#07070a]/80 to-[#07070a]" />
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-3xl flex flex-col items-center gap-4">
          {/* Royal Crest / Rating */}
          <div className="inline-flex items-center gap-2 px-4.5 py-1.5 bg-amber-500/10 border border-amber-500/40 rounded-full text-xs font-bold text-amber-300 tracking-widest uppercase font-sans">
            <span>★ {profile.rating || "5.0"} EXCELLENCE</span>
            <span>·</span>
            <span>{profile.locality || "PREMIUM SELECTION"}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-wide leading-tight drop-shadow-lg">
            {profile.shop_name}
          </h1>

          <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent my-1" />

          <p className="text-sm sm:text-base text-stone-300 italic max-w-xl leading-relaxed">
            {profile.tagline || (isEn ? "Crafted with passion, served with perfection" : "स्वाद और शुद्धता की शाही परंपरा")}
          </p>

          <div className="flex items-center gap-3.5 mt-3 flex-wrap justify-center font-sans">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 px-6 py-3 rounded-full text-xs sm:text-sm font-extrabold tracking-wide shadow-lg shadow-amber-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <span>{Icons.whatsapp}</span>
              <span>{isEn ? "Concierge Order" : "शाही ऑर्डर बुक करें"}</span>
            </a>

            <button
              type="button"
              onClick={onOpenQR}
              className="inline-flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.12] border border-amber-400/30 text-amber-300 px-5 py-3 rounded-full text-xs font-bold cursor-pointer transition-colors"
            >
              <span>QR Standee</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── CURATED MENU CATALOG ──────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto mt-12 px-5 font-serif">
        <div className="text-center mb-9">
          <span className="text-xs font-extrabold text-amber-400 tracking-[0.2em] uppercase font-sans">
            {isEn ? "HANDCRAFTED SELECTION" : "विशेष व्यंजन सूची"}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mt-1.5">
            {isEn ? "Signature Collection" : "मुख्य पेशकश व मेनू"}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const qty = cart[item.name] || 0;
            return (
              <div
                key={item.name}
                className={`rounded-2xl p-5 flex flex-col justify-between gap-3.5 transition-all duration-200 bg-[#121218]/70 ${
                  qty > 0
                    ? "border border-amber-400 shadow-lg shadow-amber-500/20"
                    : "border border-amber-500/20 hover:border-amber-500/40"
                }`}
              >
                <div>
                  <div className="flex items-baseline justify-between gap-2.5">
                    <h3 className="text-base font-bold text-white leading-snug">
                      {item.name}
                    </h3>
                    {item.price != null && (
                      <span className="text-base font-bold text-amber-400 font-sans whitespace-nowrap">
                        ₹{item.price.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-stone-400 italic mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] font-sans mt-auto">
                  <span className="text-[10px] text-white/50 uppercase tracking-wider">
                    {item.unit || (isEn ? "Per serving" : "प्रति प्लेट")}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {qty > 0 ? (
                      <div className="inline-flex items-center bg-amber-500/15 border border-amber-400 rounded-full px-2 py-0.5 gap-1">
                        <button
                          type="button"
                          onClick={() => onRemoveFromCart(item)}
                          className="w-6 h-6 text-amber-400 font-black cursor-pointer flex items-center justify-center hover:text-white transition-colors"
                        >
                          −
                        </button>
                        <span className="min-w-[16px] text-center text-xs font-bold text-white">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onAddToCart(item)}
                          className="w-6 h-6 text-amber-400 font-black cursor-pointer flex items-center justify-center hover:text-white transition-colors"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAddToCart(item)}
                        className="border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-white px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all active:scale-95"
                      >
                        + {isEn ? "Select" : "चुनें"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── GOOGLE VERIFIED REPUTATION ──────────────────────────────── */}
        {profile.rating && (
          <div className="mt-12 p-6 rounded-3xl bg-amber-500/[0.04] border border-amber-500/20 text-center flex flex-col items-center gap-2.5">
            <div className="flex gap-1 text-amber-400 text-sm">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i}>★</span>
              ))}
            </div>
            <h3 className="text-base font-bold text-white">
              {profile.rating} / 5.0 · {profile.total_reviews || 90}+ {isEn ? "Distinguished Google Ratings" : "संतुष्ट ग्राहकों का भरोसा"}
            </h3>
            <a
              href={reviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-400 underline font-sans font-semibold hover:text-amber-300 transition-colors"
            >
              {isEn ? "Read Verified Reviews on Google Maps" : "Google Maps पर प्रमाणित समीक्षाएं देखें"}
            </a>
          </div>
        )}
      </main>

      {/* ── FLOATING LUXURY CONCIERGE BAR ───────────────────────────── */}
      {totalCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-lg bg-[#121218]/95 backdrop-blur-xl border border-amber-500/50 rounded-2xl p-3.5 sm:px-6 flex items-center justify-between shadow-2xl shadow-black/90 z-[100] gap-3 font-sans">
          <div>
            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              {totalCount} {isEn ? "Dishes Selected" : "व्यंजन चुने गए"}
            </div>
            {totalPrice > 0 && (
              <div className="text-base font-extrabold text-white">
                ₹{totalPrice.toLocaleString("en-IN")}
              </div>
            )}
          </div>

          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm whitespace-nowrap shadow-md cursor-pointer transition-all active:scale-95"
          >
            <span>{Icons.whatsapp}</span>
            <span>{isEn ? "Confirm Order" : "ऑर्डर कन्फर्म करें"}</span>
          </a>
        </div>
      )}
    </div>
  );
}
