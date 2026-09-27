"use client";

import React from "react";
import type { HighlightItem } from "@/types/business";

interface HighlightsSectionProps {
  title?: string;
  subtitle?: string;
  highlights?: HighlightItem[];
  primaryColor?: string;
  lang?: "hi" | "en";
}

export function HighlightsSection({
  title,
  subtitle,
  highlights = [],
  primaryColor = "#ea580c",
  lang = "en",
}: HighlightsSectionProps) {
  const isEn = lang === "en";
  const displayTitle = title || (isEn ? "The Experience & Commitment" : "हमारी खासियत (Why Choose Us)");
  const displaySubtitle = subtitle || (isEn ? "Crafted with passion, uncompromising hygiene, and authentic recipes" : "हम अपने ग्राहकों को देते हैं बेहतरीन अनुभव और गुणवत्ता");

  const defaultHighlightsEnglish: HighlightItem[] = [
    {
      id: "hl-1",
      title: "Google Verified",
      description: "Trusted by thousands of guests with top ratings and genuine reviews",
      icon: "star",
    },
    {
      id: "hl-2",
      title: "100% Pure & Fresh",
      description: "Finest quality ingredients prepared fresh in immaculate hygiene standards",
      icon: "leaf",
    },
    {
      id: "hl-3",
      title: "Superfast Service",
      description: "Hot, freshly prepared orders served promptly to your table or doorstep",
      icon: "truck",
    },
    {
      id: "hl-4",
      title: "Best Value & Quality",
      description: "Generous portions, refined flavors, and honest transparent pricing",
      icon: "award",
    },
  ];

  const defaultHighlightsHindi: HighlightItem[] = [
    {
      id: "hl-1",
      title: "Google Verified",
      description: "सैकड़ों संतुष्ट ग्राहकों के साथ 4.6★ रेटिंग का सच्चा भरोसा",
      icon: "star",
    },
    {
      id: "hl-2",
      title: "100% शुद्ध और ताज़ा",
      description: "उच्चतम स्वच्छता और प्रामाणिक मसालों का अद्भुत संगम",
      icon: "leaf",
    },
    {
      id: "hl-3",
      title: "तेज़ सर्विस व डिलीवरी",
      description: "गरमा-गरम स्वादिष्ट खाना बिना किसी इंतज़ार के",
      icon: "truck",
    },
    {
      id: "hl-4",
      title: "उत्कृष्ट ज़ायका व सही दाम",
      description: "लाजवाब टेस्ट और शानदार क्वांटिटी वाजिब रेट्स में",
      icon: "award",
    },
  ];

  const defaultHighlights = isEn ? defaultHighlightsEnglish : defaultHighlightsHindi;
  const items = highlights.length > 0 ? highlights : defaultHighlights;

  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case "leaf":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-amber-600">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
          </svg>
        );
      case "truck":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-amber-600">
            <rect x="1" y="3" width="15" height="13" rx="1" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        );
      case "award":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-amber-600">
            <circle cx="12" cy="8" r="6" />
            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
          </svg>
        );
      case "star":
      default:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-amber-600">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
    }
  };

  return (
    <section
      id="section-highlights"
      className="py-14 sm:py-18 px-6 sm:px-10 bg-white border-b border-slate-200/80"
    >
      <div className="max-w-6xl mx-auto">
        {/* Subtle Section Header */}
        <div className="text-center mb-12">
          <span className="text-[11px] font-bold tracking-widest uppercase text-amber-600 mb-2 inline-block">
            {isEn ? "Hallmark of Excellence" : "हमारी विशेषताएं"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 m-0 tracking-tight">
            {displayTitle}
          </h2>
          {displaySubtitle && (
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto mt-2 mb-0 font-normal">
              {displaySubtitle}
            </p>
          )}
        </div>

        {/* Clean Editorial Columns in Light Theme (NO CARDS, NO ROUNDED CARD BOXES) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x lg:divide-slate-200/80">
          {items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="flex flex-col items-center text-center px-4 sm:px-6 py-2 group"
            >
              {/* Minimal Line Icon (No chunky background box) */}
              <div className="mb-4 transition-transform duration-200 group-hover:scale-110">
                {renderIcon(item.icon)}
              </div>
              <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase mb-1.5">
                {item.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs m-0 font-normal">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
