"use client";

import React from "react";
import type { BannerItem } from "@/types/business";
import { Icons } from "../templates/shared";

interface OffersBannerSectionProps {
  banner?: BannerItem;
  primaryColor?: string;
  whatsappNumber?: string | null;
  lang?: "hi" | "en";
}

export function OffersBannerSection({
  banner,
  primaryColor = "#ea580c",
  whatsappNumber,
  lang = "hi",
}: OffersBannerSectionProps) {
  const isEn = lang === "en";
  const badge = banner?.badge || (isEn ? "Special Limited Offer" : "विशेष ऑफर (Limited Time Deal)");
  const title = banner?.title || (isEn ? "Get 10% OFF on all orders above ₹300!" : "₹300 से अधिक के हर ऑर्डर पर विशेष 10% की छूट!");
  const subtitle =
    banner?.subtitle ||
    (isEn
      ? "Mention coupon code 'ICCHA10' when ordering on WhatsApp to claim your discount."
      : "WhatsApp पर ऑर्डर करते समय कूपन कोड 'ICCHA10' बताएं और छूट का लाभ उठाएं।");

  const waText = isEn
    ? "Hi! I would like to order with the 'ICCHA10' offer."
    : "नमस्ते! मुझे 'ICCHA10' ऑफर के साथ ऑर्डर करना है।";
  const targetWhatsapp = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(waText)}` : "#";

  return (
    <section
      id="section-offers"
      className="py-10 px-6 border-y border-white/[0.08] relative overflow-hidden bg-gradient-to-r from-amber-500/15 via-[#11141c] to-[#0a0c12]"
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-6">
        <div className="max-w-2xl">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2.5 border border-amber-500/40 bg-amber-500/20 text-amber-300">
            {badge}
          </span>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white m-0 mb-1.5">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-white/75 leading-relaxed m-0">
            {subtitle}
          </p>
        </div>

        <a
          href={targetWhatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-2xl text-sm font-extrabold no-underline inline-flex items-center gap-2 shadow-lg shadow-emerald-500/30 whitespace-nowrap hover:-translate-y-0.5 transition-all duration-150"
        >
          <span className="text-white">{Icons.whatsapp}</span>
          {isEn ? "Claim Offer on WhatsApp" : "ऑफर का लाभ उठाएं"}
        </a>
      </div>
    </section>
  );
}
