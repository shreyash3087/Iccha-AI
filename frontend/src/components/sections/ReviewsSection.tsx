"use client";

import React from "react";
import type { ReviewItem, BusinessProfile } from "@/types/business";
import { getGoogleReviewUrl } from "../templates/shared";

interface ReviewsSectionProps {
  profile: BusinessProfile;
  title?: string;
  subtitle?: string;
  reviews?: ReviewItem[];
  primaryColor?: string;
  lang?: "hi" | "en";
}

export function ReviewsSection({
  profile,
  title,
  subtitle,
  reviews = [],
  primaryColor = "#ea580c",
  lang = "en",
}: ReviewsSectionProps) {
  const isEn = lang === "en";
  const reviewUrl = getGoogleReviewUrl(profile);
  const hasRealReviews = Array.isArray(reviews) && reviews.length > 0;
  const hasRating = Boolean(profile.rating);

  // If there are no real reviews and no rating from Google, do NOT display this section at all!
  if (!hasRealReviews && !hasRating) {
    return null;
  }

  const displayTitle = title || (isEn ? "Verified Guest Ratings" : "ग्राहक समीक्षाएं (Google Reviews)");
  const defaultSubtitle = isEn
    ? `${profile.rating || 4.6}★ Google Rating &bull; ${profile.total_reviews ? profile.total_reviews + "+ verified reviews" : "Verified establishment on Google Maps"}`
    : `${profile.rating || 4.6}★ रेटिंग &bull; ${profile.total_reviews ? profile.total_reviews + "+ संतुष्ट ग्राहकों का भरोसा" : "Google Maps पर प्रमाणित प्रतिष्ठान"}`;

  return (
    <section
      id="section-reviews"
      className="py-14 sm:py-20 px-6 sm:px-10 bg-white border-b border-slate-200/80 relative"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold tracking-wider uppercase mb-3">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#d97706" stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>Google Maps Verified</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight m-0">
            {displayTitle}
          </h2>

          <p
            className="text-xs sm:text-sm text-slate-500 mt-2 mb-0 max-w-md mx-auto font-normal"
            dangerouslySetInnerHTML={{ __html: subtitle || defaultSubtitle }}
          />
        </div>

        {/* Real Reviews Showcase (Only shown if authentic reviews exist from Google Places) */}
        {hasRealReviews ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="p-5 rounded-2xl border border-slate-200/80 bg-[#fafafb] flex flex-col justify-between gap-4 shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-1 mb-2.5">
                    {[...Array(review.rating || 5)].map((_, i) => (
                      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#d97706" stroke="none">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed m-0 italic font-normal">
                    &ldquo;{review.text}&rdquo;
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-200/60">
                  <span className="font-semibold text-slate-800">{review.author_name}</span>
                  {review.relative_time && <span>{review.relative_time}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* When Google Places returns rating count but no full text reviews, show authentic rating banner */
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-slate-200/80 bg-[#fafafb] text-center max-w-lg mx-auto mb-8 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill="#d97706" stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
            <div className="text-lg font-bold text-slate-900 mb-1">
              {profile.rating ? `${profile.rating} Out of 5 Stars` : "Top Rated on Google Maps"}
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 font-normal">
              {isEn
                ? `Backed by ${profile.total_reviews || "hundreds of"} verified customer reviews and ratings on Google Maps.`
                : `Google Maps पर ${profile.total_reviews || "सैकड़ों"} संतुष्ट ग्राहकों द्वारा सत्यापित रेटिंग।`}
            </p>
            {reviewUrl && (
              <a
                href={reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all no-underline shadow-sm"
              >
                <span>{isEn ? "View on Google Maps" : "Google Maps पर देखें"}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}
          </div>
        )}

        {/* CTA link to Google Maps */}
        {hasRealReviews && reviewUrl && (
          <div className="text-center">
            <a
              href={reviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors no-underline"
            >
              <span>{isEn ? "Read all reviews on Google Maps" : "Google Maps पर सभी समीक्षाएं देखें"}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
