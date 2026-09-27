"use client";

import React from "react";
import type { StorySectionData, BusinessProfile } from "@/types/business";

interface StorySectionProps {
  profile: BusinessProfile;
  title?: string;
  subtitle?: string;
  story?: StorySectionData;
  primaryColor?: string;
  lang?: "hi" | "en";
}

export function StorySection({
  profile,
  title,
  subtitle,
  story,
  primaryColor = "#ea580c",
  lang = "hi",
}: StorySectionProps) {
  const isEn = lang === "en";
  const brandColor = primaryColor || profile.primary_color || "#ea580c";
  const displayTitle = title || (isEn ? "Our Story" : "हमारी कहानी (Our Story)");
  const displaySubtitle = subtitle || (isEn ? "A tradition of authenticity, quality & customer trust" : "स्वाद, परंपरा और ईमानदारी का अटूट विश्वास");

  const defaultContentHi = `${profile.shop_name} में हम सिर्फ खाना नहीं, खुशियां और संतुष्टि परोसते हैं। शहरवासियों को सर्वोत्तम और शुद्ध व्यंजन उपलब्ध कराना हमारा संकल्प रहा है। ताज़ा मसालों और पारंपरिक रेसिपी के साथ बना हर निवाला आपके दिल को छू जाएगा।`;
  const defaultContentEn = `At ${profile.shop_name}, we take immense pride in delivering top-quality offerings, authentic recipes, and genuine hospitality to our community. Each order is prepared fresh with the finest ingredients and genuine care.`;

  const content = story?.content || (isEn ? defaultContentEn : defaultContentHi);
  const image =
    story?.image_url ||
    profile.header_image ||
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80";

  const defaultStats = isEn
    ? [
        { label: "Years of Trust", value: "7+ Years" },
        { label: "Happy Customers", value: "50,000+" },
        { label: "Special Offerings", value: `${profile.products?.length || 10}+ Items` },
      ]
    : [
        { label: "सालों का विश्वास", value: "7+ Years" },
        { label: "संतुष्ट ग्राहक", value: "50,000+" },
        { label: "स्वादिष्ट व्यंजन", value: `${profile.products?.length || 10}+ Items` },
      ];

  const stats = story?.stats && story.stats.length > 0 ? story.stats : defaultStats;

  return (
    <section
      id="section-story"
      className="py-16 sm:py-20 px-6 bg-gradient-to-b from-[#0a0c12] to-[#12151e] border-b border-white/[0.06]"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Story Text Column */}
        <div>
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3.5 border border-amber-500/30 bg-amber-500/15 text-amber-400">
            Since 2018 • Heritage of Quality
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white m-0 mb-4 leading-tight">
            {displayTitle}
          </h2>

          {displaySubtitle && (
            <p className="text-base sm:text-lg font-semibold m-0 mb-4.5 text-amber-400">
              {displaySubtitle}
            </p>
          )}

          <p className="text-sm sm:text-base text-white/80 leading-relaxed m-0 mb-7">
            {content}
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4 pt-5 border-t border-white/10">
            {stats.map((s, idx) => (
              <div key={idx}>
                <div className="text-2xl font-black text-white leading-none">
                  {s.value}
                </div>
                <div className="text-xs text-white/55 mt-1 font-medium">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Story Image Column */}
        <div className="relative">
          <div className="relative rounded-3xl overflow-hidden border border-white/12 shadow-2xl h-[380px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={title || profile.shop_name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 bg-black/65 backdrop-blur-md p-3.5 sm:p-4.5 rounded-2xl border border-white/15">
              <div className="text-white font-bold text-sm">
                {profile.shop_name}
              </div>
              <div className="text-white/70 text-xs mt-0.5">
                {profile.address || "ताज़ा और पारंपरिक स्वाद की पहचान"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
