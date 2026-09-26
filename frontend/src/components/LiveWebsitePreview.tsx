"use client";

import type { BusinessProfile } from "@/types/business";

interface LiveWebsitePreviewProps {
  profile: BusinessProfile | null;
}

export function LiveWebsitePreview({ profile }: LiveWebsitePreviewProps) {
  if (!profile || (!profile.shop_name && (!profile.products || profile.products.length === 0))) {
    return (
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px dashed rgba(255, 153, 51, 0.2)",
          borderRadius: "16px",
          padding: "24px 20px",
          textAlign: "center",
          color: "rgba(255, 255, 255, 0.4)",
          fontSize: "0.85rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div style={{ fontSize: "1.5rem" }}>✨</div>
        <span style={{ fontWeight: 500, color: "rgba(255, 255, 255, 0.7)" }}>
          लाइव वेबसाइट प्रीव्यू (Live Website Preview)
        </span>
        <span style={{ fontSize: "0.78rem" }}>
          जैसे-जैसे आप बोलेंगे, आपकी दुकान की वेबसाइट यहाँ अपने आप तैयार होती जाएगी।
        </span>
      </div>
    );
  }

  const hasProducts = profile.products && profile.products.length > 0;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "480px",
        background: "rgba(18, 18, 22, 0.85)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255, 153, 51, 0.3)",
        borderRadius: "20px",
        padding: "20px",
        boxShadow: "0 12px 36px -8px rgba(0, 0, 0, 0.6), 0 0 24px rgba(255, 153, 51, 0.08)",
        transition: "all 0.3s ease",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
      className="animate-fade-in-up"
    >
      {/* ── Header Bar ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          paddingBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: profile.interview_complete ? "#10b981" : "#ff9933",
              boxShadow: profile.interview_complete
                ? "0 0 8px #10b981"
                : "0 0 8px #ff9933",
            }}
          />
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: profile.interview_complete ? "#10b981" : "#ff9933",
            }}
          >
            {profile.interview_complete ? "वेबसाइट तैयार है (Ready)" : "लाइव बन रहा है (Live Updating)"}
          </span>
        </div>

        {profile.verified_via_places && (
          <span
            style={{
              fontSize: "0.7rem",
              padding: "2px 8px",
              borderRadius: "999px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#34d399",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            ✓ Google Verified
          </span>
        )}
      </div>

      {/* ── Shop Info Card ─────────────────────────────────────────────── */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#ffffff",
              margin: 0,
            }}
          >
            {profile.shop_name || "आपकी दुकान"}
          </h3>
          {profile.category && (
            <span
              style={{
                fontSize: "0.7rem",
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(255, 255, 255, 0.1)",
                color: "rgba(255, 255, 255, 0.7)",
                textTransform: "capitalize",
              }}
            >
              {profile.category}
            </span>
          )}
        </div>

        {(profile.locality || profile.city) && (
          <p
            style={{
              fontSize: "0.8rem",
              color: "rgba(255, 255, 255, 0.6)",
              margin: "4px 0 0 0",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            📍 {[profile.locality, profile.city].filter(Boolean).join(", ")}
          </p>
        )}

        {profile.rating && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "6px",
              fontSize: "0.8rem",
              color: "#f59e0b",
            }}
          >
            <span>★ {profile.rating.toFixed(1)}</span>
            {profile.total_reviews && (
              <span style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: "0.75rem" }}>
                ({profile.total_reviews} reviews)
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Products Grid ──────────────────────────────────────────────── */}
      {hasProducts && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "rgba(255, 255, 255, 0.5)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            खास सामान (Featured Products — {profile.products?.length})
          </span>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: "8px",
            }}
          >
            {profile.products?.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "10px",
                  padding: "8px 10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "rgba(255, 255, 255, 0.9)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.name}
                </span>
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "#ff9933",
                  }}
                >
                  {item.price !== null && item.price !== undefined
                    ? `₹${item.price.toFixed(0)}${item.unit ? ` / ${item.unit}` : ""}`
                    : "कीमत उपलब्ध"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Timings & Phone ────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          borderRadius: "10px",
          padding: "8px 12px",
          fontSize: "0.75rem",
          color: "rgba(255, 255, 255, 0.7)",
        }}
      >
        <span>
          🕒 {profile.hours?.open_time || "9:00 AM"} – {profile.hours?.close_time || "9:00 PM"}
        </span>
        {profile.phone && (
          <span style={{ color: "#34d399", fontWeight: 600 }}>
            📞 {profile.phone}
          </span>
        )}
      </div>

      {/* ── Website Ready Celebration ──────────────────────────────────── */}
      {profile.interview_complete && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(255, 153, 51, 0.2))",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            borderRadius: "12px",
            padding: "10px 14px",
            textAlign: "center",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "#ffffff",
          }}
        >
          🎉 बधाई हो! आपकी दुकान का वेबपेज तैयार है।
        </div>
      )}
    </div>
  );
}
