"use client";

import React from "react";
import type { BusinessProfile, ProductItem, SiteSection } from "@/types/business";
import { StoreNavbar } from "./StoreNavbar";
import { HeroSection } from "./HeroSection";
import { HighlightsSection } from "./HighlightsSection";
import { CatalogSection } from "./CatalogSection";
import { ReviewsSection } from "./ReviewsSection";
import { GallerySection } from "./GallerySection";
import { StorySection } from "./StorySection";
import { OffersBannerSection } from "./OffersBannerSection";
import { FAQSection } from "./FAQSection";
import { ContactSection } from "./ContactSection";
import { StoreFooter } from "./StoreFooter";

interface SectionRendererProps {
  profile: BusinessProfile;
  cart: Record<string, number>;
  onAddToCart: (item: ProductItem) => void;
  onRemoveFromCart: (item: ProductItem) => void;
  onOpenQR: () => void;
  lang?: "hi" | "en";
  onLanguageChange?: (newLang: "hi" | "en") => void;
  creatorLangLabel?: string;
  creatorLangCode?: string;
}

export function SectionRenderer({
  profile,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onOpenQR,
  lang = "en",
  onLanguageChange = () => {},
  creatorLangLabel = "हिंदी",
  creatorLangCode = "hi",
}: SectionRendererProps) {
  const brandColor = profile.primary_color || "#ea580c";

  // If profile has explicit sections, render them in order
  const sections: SiteSection[] =
    profile.sections && profile.sections.length > 0
      ? profile.sections
      : [
          { id: "sec-hero", type: "hero", enabled: true },
          { id: "sec-highlights", type: "highlights", enabled: true },
          { id: "sec-catalog", type: "catalog", enabled: true },
          { id: "sec-reviews", type: "reviews", enabled: true },
          { id: "sec-contact", type: "contact", enabled: true },
        ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-amber-100 flex flex-col">
      {/* ── Real Storefront Navigation Bar ── */}
      <StoreNavbar
        profile={profile}
        lang={lang}
        onLanguageChange={onLanguageChange}
        creatorLangLabel={creatorLangLabel}
        creatorLangCode={creatorLangCode}
      />

      {/* ── Main Page Content Sections ── */}
      <main className="flex-1">
        {sections.map((section) => {
          if (!section.enabled) return null;

          switch (section.type) {
            case "hero":
              return (
                <HeroSection
                  key={section.id || "hero"}
                  profile={profile}
                  title={section.title}
                  subtitle={section.subtitle}
                  imageUrl={section.data?.image_url}
                  onOpenQR={onOpenQR}
                  primaryColor={brandColor}
                  lang={lang}
                />
              );

            case "highlights":
              return (
                <HighlightsSection
                  key={section.id || "highlights"}
                  title={section.title}
                  subtitle={section.subtitle}
                  highlights={section.data?.highlights}
                  primaryColor={brandColor}
                  lang={lang}
                />
              );

            case "catalog":
              return (
                <CatalogSection
                  key={section.id || "catalog"}
                  profile={profile}
                  title={section.title}
                  subtitle={section.subtitle}
                  cart={cart}
                  onAddToCart={onAddToCart}
                  onRemoveFromCart={onRemoveFromCart}
                  primaryColor={brandColor}
                  lang={lang}
                />
              );

            case "reviews":
              return (
                <ReviewsSection
                  key={section.id || "reviews"}
                  profile={profile}
                  title={section.title}
                  subtitle={section.subtitle}
                  reviews={section.data?.reviews}
                  primaryColor={brandColor}
                  lang={lang}
                />
              );

            case "gallery":
              return (
                <GallerySection
                  key={section.id || "gallery"}
                  title={section.title}
                  subtitle={section.subtitle}
                  gallery={section.data?.gallery}
                  primaryColor={brandColor}
                  lang={lang}
                />
              );

            case "story":
              return (
                <StorySection
                  key={section.id || "story"}
                  profile={profile}
                  title={section.title}
                  subtitle={section.subtitle}
                  story={section.data?.story}
                  primaryColor={brandColor}
                  lang={lang}
                />
              );

            case "offers":
              return (
                <OffersBannerSection
                  key={section.id || "offers"}
                  banner={section.data?.banner}
                  primaryColor={brandColor}
                  whatsappNumber={profile.whatsapp}
                  lang={lang}
                />
              );

            case "faq":
              return (
                <FAQSection
                  key={section.id || "faq"}
                  title={section.title}
                  subtitle={section.subtitle}
                  faqs={section.data?.faqs}
                  primaryColor={brandColor}
                  lang={lang}
                />
              );

            case "contact":
              return (
                <ContactSection
                  key={section.id || "contact"}
                  profile={profile}
                  title={section.title}
                  subtitle={section.subtitle}
                  primaryColor={brandColor}
                  lang={lang}
                />
              );

            default:
              return null;
          }
        })}
      </main>

      {/* ── Comprehensive Light Theme Storefront Footer ── */}
      <StoreFooter profile={profile} lang={lang} />
    </div>
  );
}
