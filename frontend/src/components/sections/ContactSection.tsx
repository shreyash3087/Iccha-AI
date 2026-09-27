"use client";

import React from "react";
import type { BusinessProfile } from "@/types/business";
import { getWhatsAppHref, Icons } from "../templates/shared";

interface ContactSectionProps {
  profile: BusinessProfile;
  title?: string;
  subtitle?: string;
  primaryColor?: string;
  lang?: "hi" | "en";
}

export function ContactSection({
  profile,
  title,
  subtitle,
  primaryColor = "#ea580c",
  lang = "en",
}: ContactSectionProps) {
  const isEn = lang === "en";
  const displayTitle = title || (isEn ? "Hours & Store Location" : "दुकान का समय और पता");
  const displaySubtitle = subtitle || (isEn ? "Visit our establishment in person or connect with us directly" : "हमसे संपर्क करें या दुकान पर पधारें");
  const hours = profile.hours;

  const whatsappHref = getWhatsAppHref(
    profile.whatsapp,
    isEn
      ? `Hello! I would like to inquire about ${profile.shop_name}.`
      : `नमस्ते! मुझे ${profile.shop_name} के बारे में जानकारी चाहिए।`
  );

  const mapsSearchUrl = profile.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${profile.shop_name}, ${profile.address}`)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.shop_name)}`;

  return (
    <section
      id="section-contact"
      className="py-16 sm:py-24 px-6 sm:px-10 bg-[#fafafb] border-t border-slate-200/80"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="mb-12">
          <span className="text-[11px] font-bold tracking-widest uppercase text-amber-600 mb-2 inline-block">
            {isEn ? "Plan Your Visit" : "पधारने की जानकारी"}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight m-0">
            {displayTitle}
          </h2>
          {displaySubtitle && (
            <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-0 max-w-lg font-normal">
              {displaySubtitle}
            </p>
          )}
        </div>

        {/* Unique Architectural 2-Column Layout (NO CARDS, NO 3-COLUMN TABLE) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 pt-6 border-t border-slate-200/80">
          {/* Left Column: Physical Location & Immediate Contact Actions (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {isEn
                    ? `Open Today: ${hours?.open_time || "09:00 AM"} – ${hours?.close_time || "10:00 PM"}`
                    : `आज खुला है: ${hours?.open_time || "09:00 AM"} – ${hours?.close_time || "10:00 PM"}`}
                </span>
              </div>

              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                {isEn ? "Store Address" : "प्रतिष्ठान का पता"}
              </h3>
              <p className="text-lg sm:text-xl font-medium text-slate-900 leading-relaxed max-w-xl mb-6">
                {profile.address || `${profile.locality || "Bhopal"}, India`}
              </p>

              {/* Get Directions Action */}
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={mapsSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs no-underline transition-all shadow-sm"
                >
                  <span className="text-amber-400">{Icons.location}</span>
                  <span>{isEn ? "Get Directions on Google Maps" : "Google Maps पर दिशा-निर्देश देखें"}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                </a>

                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs no-underline transition-all"
                  >
                    <span>{Icons.phone}</span>
                    <span>{profile.phone}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Direct WhatsApp Concierge Strip */}
            {profile.whatsapp && (
              <div className="pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    {isEn ? "Direct Concierge & Orders" : "सीधा संपर्क व बुकिंग"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {isEn ? "Message directly on WhatsApp for parcels, tables or inquiries." : "पूछताछ या ऑर्डर के लिए WhatsApp पर संपर्क करें।"}
                  </div>
                </div>

                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold no-underline transition-colors shrink-0"
                >
                  <span>{Icons.whatsapp}</span>
                  <span>WhatsApp ({profile.whatsapp})</span>
                </a>
              </div>
            )}
          </div>

          {/* Right Column: Weekly Schedule & Service Capabilities (5 cols) */}
          <div className="lg:col-span-5 lg:border-l lg:border-slate-200/80 lg:pl-10 flex flex-col justify-between gap-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                {isEn ? "Operating Schedule" : "साप्ताहिक समय-सारणी"}
              </h3>

              {/* Schedule Timeline */}
              <div className="divide-y divide-slate-200/60 text-xs sm:text-sm">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{hours?.days || "Monday – Saturday"}</span>
                  <span className="text-slate-600 font-mono text-xs">
                    {hours?.open_time || "09:00 AM"} – {hours?.close_time || "10:00 PM"}
                  </span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">
                    {hours?.closed_days && hours.closed_days.length > 0
                      ? hours.closed_days.join(", ")
                      : "Sunday"}
                  </span>
                  <span className="text-rose-600 font-semibold text-xs">
                    {hours?.closed_days && hours.closed_days.length > 0 ? (isEn ? "Closed" : "बंद") : "10:00 AM – 10:00 PM"}
                  </span>
                </div>
              </div>

              {/* Service Amenities Highlights */}
              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{isEn ? "Dine-in, Takeaway & WhatsApp Ordering Ready" : "डाइन-इन, पार्सल व WhatsApp ऑर्डरिंग उपलब्ध"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{isEn ? "Instant Table Reservations via WhatsApp Concierge" : "तुरंत टेबल रिज़र्वेशन व पूछताछ"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{isEn ? "Air-Conditioned & Hygiene Certified Facility" : "वातानुकूलित व स्वच्छता प्रमाणित परिसर"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
