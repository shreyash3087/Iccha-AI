"use client";

import React, { useState, useMemo } from "react";
import type { ProductItem, BusinessProfile } from "@/types/business";
import { getWhatsAppHref, buildWhatsAppCartMessage, Icons } from "../templates/shared";
import { getDishImageUrl } from "@/lib/images";

interface CatalogSectionProps {
  profile: BusinessProfile;
  title?: string;
  subtitle?: string;
  cart: Record<string, number>;
  onAddToCart: (item: ProductItem) => void;
  onRemoveFromCart: (item: ProductItem) => void;
  primaryColor?: string;
  lang?: "hi" | "en";
}

function isVegItem(name: string): boolean {
  const n = name.toLowerCase();
  if (
    n.includes("chicken") ||
    n.includes("mutton") ||
    n.includes("egg") ||
    n.includes("fish") ||
    n.includes("prawn") ||
    n.includes("meat") ||
    n.includes("non-veg")
  ) {
    return false;
  }
  return true;
}

export function CatalogSection({
  profile,
  title,
  subtitle,
  cart,
  onAddToCart,
  onRemoveFromCart,
  primaryColor = "#ea580c",
  lang = "en",
}: CatalogSectionProps) {
  const items = profile.products || [];
  const isProductStore = profile.category === "product";
  const isEn = lang === "en";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Derive categories from items
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      const n = item.name.toLowerCase();
      if (n.includes("chaat") || n.includes("bruschetta") || n.includes("bread") || n.includes("roll") || n.includes("nacho") || n.includes("pita")) {
        set.add(isEn ? "Starters & Appetizers" : "शुरुआती व्यंजन");
      } else if (n.includes("biryani") || n.includes("rice") || n.includes("curry") || n.includes("chicken") || n.includes("paneer")) {
        set.add(isEn ? "Main Course" : "मुख्य भोजन");
      } else if (item.category) {
        set.add(item.category);
      }
    });
    return ["All", ...Array.from(set)];
  }, [items, isEn]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;
      if (selectedCategory === "All" || selectedCategory === "all") return true;

      const n = item.name.toLowerCase();
      if (selectedCategory.includes("Starter") && (n.includes("chaat") || n.includes("bruschetta") || n.includes("bread") || n.includes("roll") || n.includes("nacho") || n.includes("pita"))) {
        return true;
      }
      if (selectedCategory.includes("Main") && (n.includes("biryani") || n.includes("rice") || n.includes("curry") || n.includes("chicken") || n.includes("paneer") || n.includes("platter"))) {
        return true;
      }
      return item.category === selectedCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  const defaultTitle = isEn
    ? (isProductStore ? "Menu & Culinary Selections" : "Our Services & Packages")
    : (isProductStore ? "हमारा मेनू / रेट सूची" : "हमारी सेवाएं व पैकेज");
  const defaultSubtitle = isEn
    ? "Freshly prepared to order. Select items to order directly via WhatsApp."
    : "पसंदीदा आइटम चुनें और 1-क्लिक में WhatsApp पर ऑर्डर भेजें";

  const cartEntries = Object.entries(cart).filter(([, q]) => q > 0);
  const totalItemsCount = cartEntries.reduce((s, [, q]) => s + q, 0);
  const totalPrice = cartEntries.reduce((s, [name, q]) => {
    const it = items.find((i) => i.name === name);
    return s + (it?.price || 0) * q;
  }, 0);

  const whatsappOrderHref = getWhatsAppHref(profile.whatsapp, buildWhatsAppCartMessage(profile, cart));

  return (
    <section
      id="section-catalog"
      className="py-14 sm:py-20 px-6 sm:px-10 bg-[#fbfbfd] border-b border-slate-200/80 relative"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section Header: Minimal & Crisp in Light Theme */}
        <div className="text-center mb-10">
          <span className="text-[11px] font-bold tracking-widest uppercase text-amber-600 mb-2 inline-block">
            {isProductStore ? (isEn ? "Signature Menu" : "खास मेनू") : (isEn ? "Services" : "सेवाएं")}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight m-0">
            {title || defaultTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-0 max-w-md mx-auto font-normal">
            {subtitle || defaultSubtitle}
          </p>
        </div>

        {/* Filter and Search Bar: Sleek & Light */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200/80">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
            {categories.map((cat) => {
              const active = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all whitespace-nowrap border-0 ${
                    active
                      ? "bg-slate-900 text-white font-bold shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:text-slate-950 hover:bg-slate-200/60"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search Field */}
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder={isEn ? "Search menu items..." : "आइटम खोजें..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-full py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Menu Items: Editorial List in Light Theme (NO ROUNDED AI CARDS!) */}
        <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200/80 p-2 sm:p-4 shadow-sm">
          {filteredItems.map((item) => {
            const qty = cart[item.name] || 0;
            const itemImage = getDishImageUrl(item.name, item.image_url);
            const isVeg = isVegItem(item.name);

            return (
              <div
                key={item.name}
                className="py-4 sm:py-5 flex items-start gap-4 sm:gap-6 hover:bg-slate-50/70 rounded-xl px-2 sm:px-4 transition-colors group"
              >
                {/* Authentic Food Photo Thumbnail */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={itemImage}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Veg / Non-Veg Indicator Top Left */}
                  <div className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur-sm p-0.5 rounded shadow-sm">
                    <div
                      className={`w-3.5 h-3.5 border flex items-center justify-center ${
                        isVeg ? "border-emerald-600" : "border-rose-600"
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          isVeg ? "bg-emerald-600" : "bg-rose-600"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Dish Info & Description */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-normal m-0 leading-snug">
                      {item.name}
                    </h3>
                  </div>

                  {item.description && item.description !== "None" && (
                    <p className="text-xs text-slate-500 mt-1 mb-0 leading-relaxed line-clamp-2 font-normal">
                      {item.description}
                    </p>
                  )}

                  {/* Price display */}
                  <div className="mt-2 text-sm sm:text-base font-extrabold text-amber-600">
                    {item.price != null ? `₹${item.price.toFixed(0)}` : (isEn ? "Available" : "उपलब्ध")}
                  </div>
                </div>

                {/* Add to Cart / Quantity Control */}
                <div className="shrink-0 flex items-center self-center">
                  {qty > 0 ? (
                    <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                      <button
                        type="button"
                        onClick={() => onRemoveFromCart(item)}
                        className="text-amber-800 hover:text-amber-950 font-bold text-xs w-5 h-5 flex items-center justify-center cursor-pointer transition-colors bg-transparent border-0"
                      >
                        &minus;
                      </button>
                      <span className="text-xs font-extrabold text-amber-900 min-w-[14px] text-center">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => onAddToCart(item)}
                        className="text-amber-800 hover:text-amber-950 font-bold text-xs w-5 h-5 flex items-center justify-center cursor-pointer transition-colors bg-transparent border-0"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAddToCart(item)}
                      className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 border border-slate-200 transition-all cursor-pointer shadow-sm"
                    >
                      <span>+ {isEn ? "Add" : "जोड़ें"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating WhatsApp Cart Bar when items are selected */}
        {totalItemsCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-fade-in">
            <div className="bg-white/95 border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-2xl flex items-center justify-between gap-4 backdrop-blur-xl">
              <div>
                <div className="text-xs text-slate-500">
                  {totalItemsCount} {isEn ? "items selected" : "आइटम चुने गए"}
                </div>
                <div className="text-base font-extrabold text-slate-900">
                  ₹{totalPrice.toFixed(0)}
                </div>
              </div>

              <a
                href={whatsappOrderHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold no-underline shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <span className="text-white">{Icons.whatsapp}</span>
                <span>{isEn ? "Order on WhatsApp" : "WhatsApp पर ऑर्डर भेजें"}</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
