"use client";

import React, { useState } from "react";
import type { GalleryItem } from "@/types/business";

interface GallerySectionProps {
  title?: string;
  subtitle?: string;
  gallery?: GalleryItem[];
  primaryColor?: string;
  lang?: "hi" | "en";
}

const DEFAULT_GALLERY_PHOTOS: GalleryItem[] = [
  {
    id: "gal-1",
    url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    alt: "Dum Biryani Special",
    caption: "शाही दम बिरयानी - Authentic Indian Flavors",
    tag: "Dishes",
  },
  {
    id: "gal-2",
    url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    alt: "Restaurant Dining Atmosphere",
    caption: "सवारियां रेस्टोरेंट - आरामदायक और पारिवारिक बैठक",
    tag: "Ambiance",
  },
  {
    id: "gal-3",
    url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80",
    alt: "Paneer Special",
    caption: "शाही पनीर - शुद्ध मक्खन व मसालों में तैयार",
    tag: "Dishes",
  },
  {
    id: "gal-4",
    url: "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80",
    alt: "Jeera Rice & Curry",
    caption: "जीरा राइस - खुशबूदार बासमती चावल",
    tag: "Dishes",
  },
  {
    id: "gal-5",
    url: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80",
    alt: "Table Serving",
    caption: "ताज़ा और गर्म परोसा गया स्वादिष्ट भोजन",
    tag: "Ambiance",
  },
  {
    id: "gal-6",
    url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    alt: "Naan and Breads",
    caption: "तंदूरी रोटियां व नान - भट्टी से सीधा",
    tag: "Dishes",
  },
];

export function GallerySection({
  title,
  subtitle,
  gallery = [],
  primaryColor = "#ea580c",
  lang = "hi",
}: GallerySectionProps) {
  const isEn = lang === "en";
  const displayTitle = title || (isEn ? "Photo Gallery" : "फ़ोटो गैलरी (Photo Gallery)");
  const displaySubtitle = subtitle || (isEn ? "A glimpse of our delicious offerings & ambiance" : "हमारे स्वादिष्ट व्यंजन और प्रतिष्ठान के खुशनुमा माहौल की एक झलक");
  const items = gallery.length > 0 ? gallery : DEFAULT_GALLERY_PHOTOS;
  const [activeTag, setActiveTag] = useState<string>("All");

  const tags = ["All", ...Array.from(new Set(items.map((it) => it.tag).filter(Boolean)))];

  const filtered = activeTag === "All" ? items : items.filter((it) => it.tag === activeTag);

  return (
    <section
      id="section-gallery"
      className="py-16 sm:py-20 px-6 bg-[#090b10] border-b border-white/[0.06]"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white m-0 mb-2">
            {displayTitle}
          </h2>
          {displaySubtitle && (
            <p className="text-sm sm:text-base text-white/65 m-0">
              {displaySubtitle}
            </p>
          )}
        </div>

        {/* Tag Filters */}
        {tags.length > 2 && (
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {tags.map((tag) => {
              const active = activeTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag as string)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold cursor-pointer transition-colors border ${
                    active
                      ? "text-white"
                      : "bg-white/[0.06] hover:bg-white/10 text-white/70 border-white/10"
                  }`}
                  style={active ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}

        {/* Photos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filtered.map((photo) => (
            <div
              key={photo.id || photo.url}
              className="relative h-60 rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.alt || "Storefront photo"}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end p-4">
                {photo.caption && (
                  <span className="text-white text-xs font-semibold leading-snug drop-shadow-md">
                    {photo.caption}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
