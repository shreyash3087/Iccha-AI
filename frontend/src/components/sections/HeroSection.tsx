"use client";

import React from "react";
import type { BusinessProfile } from "@/types/business";
import { getWhatsAppHref, getGoogleReviewUrl, Icons } from "../templates/shared";

interface HeroSectionProps {
  profile: BusinessProfile;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  onOpenQR: () => void;
  primaryColor?: string;
  lang?: "hi" | "en";
}

export function HeroSection({
  profile,
  title,
  subtitle,
  imageUrl,
  onOpenQR,
  primaryColor,
  lang = "hi",
}: HeroSectionProps) {
  const isDefaultTitle = !title || title === "मेरी दुकान" || title === "My Store" || title === "My Shop" || title === "Storefront";
  const displayTitle = (isDefaultTitle ? profile.shop_name : title) || profile.shop_name || "Storefront";
  const isEn = lang === "en";

  const defaultHindiSub = profile.locality
    ? `${profile.locality} का सबसे पसंदीदा और लोकप्रिय प्रतिष्ठान`
    : "शुद्धता और स्वाद का विश्वसनीय ठिकाना";
  const defaultEnglishSub = profile.locality
    ? `The most beloved dining and culinary destination in ${profile.locality}`
    : "Your trusted destination for pure, authentic taste and quality";

  const displaySubtitle = profile.tagline || subtitle || (isEn ? defaultEnglishSub : defaultHindiSub);

  const bgImage =
    imageUrl ||
    profile.header_image ||
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=85";

  const whatsappMessage = isEn
    ? `Hello! I would like to place an order from ${displayTitle}.`
    : `नमस्ते! मुझे ${displayTitle} से ऑर्डर करना है।`;
  const whatsappHref = getWhatsAppHref(profile.whatsapp, whatsappMessage);
  const reviewUrl = getGoogleReviewUrl(profile);

  return (
    <section
      id="section-hero"
      className="relative min-h-[440px] flex items-center justify-center overflow-hidden border-b border-white/[0.08] bg-[#090b10]"
    >
      {/* Background Image with Cinematic Gradient Overlay */}
      <div className="absolute inset-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bgImage}
          alt={displayTitle}
          className="w-full h-full object-cover scale-105 brightness-[0.32] saturate-120 transition-transform duration-7000"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#090b10]/40 via-transparent to-[#090b10]/95" />
      </div>

      {/* Hero Content */}
      <div className="relative max-w-5xl w-full mx-auto px-6 py-16 sm:py-20 text-center flex flex-col items-center gap-4.5">
        {/* Top Badges */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center">
          <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 backdrop-blur-md text-white px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
            {Icons.store} {profile.category === "service" ? "Service Studio" : "Authentic Kitchen & Store"}
          </span>

          {profile.rating && (
            <span className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/35 backdrop-blur-md text-amber-300 px-3.5 py-1 rounded-full text-xs font-bold">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#fbbf24" stroke="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Google {profile.rating}★ ({profile.total_reviews || 120}+ Reviews)
            </span>
          )}

        </div>

        {/* Headline Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white m-0 leading-tight tracking-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
          {displayTitle}
        </h1>

        {/* Subtitle / Tagline */}
        <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] m-0">
          {displaySubtitle}
        </p>

        {/* Address & Timings Pill */}
        {profile.address && (
          <div className="inline-flex items-center gap-2 bg-black/45 border border-white/[0.12] backdrop-blur-md px-4 py-1.5 rounded-xl text-xs sm:text-sm text-white/75 max-w-[85%] leading-snug">
            <span className="text-amber-400 shrink-0">{Icons.location}</span>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">
              {profile.address}
            </span>
          </div>
        )}

        {/* Action CTAs */}
        <div className="flex items-center gap-3 flex-wrap justify-center mt-2.5">
          {profile.whatsapp && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-2xl text-sm font-extrabold no-underline shadow-lg shadow-emerald-500/35 hover:-translate-y-0.5 transition-all duration-150"
            >
              <span className="text-white">{Icons.whatsapp}</span>
              {isEn ? "Order on WhatsApp" : "WhatsApp पर ऑर्डर करें"}
            </a>
          )}

          {profile.phone && (
            <a
              href={`tel:${profile.phone}`}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md text-white px-5.5 py-3 rounded-2xl text-sm font-bold no-underline hover:-translate-y-0.5 transition-all duration-150"
            >
              {Icons.phone}
              {isEn ? "Call Us" : "कॉल करें"} ({profile.phone})
            </a>
          )}

          {reviewUrl && (
            <a
              href={reviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 backdrop-blur-md text-amber-300 px-5 py-3 rounded-2xl text-sm font-bold no-underline hover:-translate-y-0.5 transition-all duration-150"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#fbbf24" stroke="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Google Reviews
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
