"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRoomContext } from "@livekit/components-react";
import type { BusinessProfile, ProductItem } from "@/types/business";

interface LiveWebsitePreviewProps {
  profile: BusinessProfile | null;
  onProfileUpdate?: (profile: BusinessProfile) => void;
}

export function LiveWebsitePreview({ profile, onProfileUpdate }: LiveWebsitePreviewProps) {
  const room = useRoomContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Handle image upload & vision extraction
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage("फोटो अपलोड हो रही है...");

    try {
      // 1. Immediately notify the Python agent via DataChannel
      if (room?.localParticipant) {
        const startMsg = JSON.stringify({
          type: "IMAGE_UPLOAD_STARTED",
          filename: file.name,
        });
        await room.localParticipant.publishData(new TextEncoder().encode(startMsg), {
          reliable: true,
        });
      }

      setUploadMessage("ICCHA लिस्ट तैयार कर रही है...");

      // 2. Upload file to vision extraction API
      const formData = new FormData();
      formData.append("file", file);
      formData.append("business_type", profile?.business_type || "general");

      const res = await fetch("/api/vision/extract", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      const extractedItems: ProductItem[] = data.items || [];

      if (extractedItems.length > 0) {
        // 3. Notify Python agent with extracted items via DataChannel
        if (room?.localParticipant) {
          const itemsMsg = JSON.stringify({
            type: "IMAGE_ITEMS_EXTRACTED",
            items: extractedItems,
          });
          await room.localParticipant.publishData(new TextEncoder().encode(itemsMsg), {
            reliable: true,
          });
        }

        // 4. Update local profile optimistically if callback provided
        if (profile && onProfileUpdate) {
          const updated: BusinessProfile = {
            ...profile,
            products: [...(profile.products || []), ...extractedItems],
          };
          onProfileUpdate(updated);
        }

        setUploadMessage(`✓ ${extractedItems.length} आइटम्स जुड़ गए!`);
        setTimeout(() => setUploadMessage(null), 4000);
      } else {
        setUploadMessage("कोई आइटम नहीं मिला, कृपया साफ फोटो अपलोड करें।");
        setTimeout(() => setUploadMessage(null), 4000);
      }
    } catch (err) {
      console.error("[Vision Upload] Failed:", err);
      setUploadMessage("अपलोड विफल रहा। पुनः प्रयास करें।");
      setTimeout(() => setUploadMessage(null), 4000);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

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
  const isService = profile.business_type === "service";
  const candidates = profile.google_candidates || [];

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "480px",
        background: "rgba(18, 18, 24, 0.88)",
        backdropFilter: "blur(18px)",
        border: "1px solid rgba(255, 153, 51, 0.28)",
        borderRadius: "20px",
        padding: "20px",
        boxShadow: "0 14px 40px -10px rgba(0, 0, 0, 0.65), 0 0 24px rgba(255, 153, 51, 0.08)",
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
              boxShadow: profile.interview_complete ? "0 0 8px #10b981" : "0 0 8px #ff9933",
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

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {profile.verified_via_places ? (
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
          ) : profile.wants_google_review_help ? (
            <span
              style={{
                fontSize: "0.7rem",
                padding: "2px 8px",
                borderRadius: "999px",
                background: "rgba(99, 102, 241, 0.15)",
                color: "#a5b4fc",
                border: "1px solid rgba(99, 102, 241, 0.3)",
              }}
            >
              ⭐ Google Review
            </span>
          ) : null}

          {isService && (
            <span
              style={{
                fontSize: "0.68rem",
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(255, 255, 255, 0.08)",
                color: "rgba(255, 255, 255, 0.7)",
              }}
            >
              सेवा केंद्र
            </span>
          )}
        </div>
      </div>

      {/* ── Shop Info ──────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>
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

        {(profile.address || profile.locality || profile.city) && (
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
            📍 {profile.address || [profile.locality, profile.city].filter(Boolean).join(", ")}
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

      {/* ── Multiple Google Places Candidates (Disambiguation) ─────────── */}
      {candidates.length > 1 && !profile.verified_via_places && (
        <div
          style={{
            background: "rgba(99, 102, 241, 0.08)",
            border: "1px solid rgba(99, 102, 241, 0.25)",
            borderRadius: "12px",
            padding: "10px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <span style={{ fontSize: "0.74rem", fontWeight: 600, color: "#a5b4fc" }}>
            🔍 Google पर कई विकल्प मिले (बोलकर या क्लिक करके चुनें):
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {candidates.map((c, idx) => (
              <button
                key={idx}
                onClick={async () => {
                  if (room?.localParticipant) {
                    const msg = JSON.stringify({
                      type: "SELECT_GOOGLE_PLACE",
                      candidate_index: idx + 1,
                    });
                    await room.localParticipant.publishData(new TextEncoder().encode(msg), {
                      reliable: true,
                    });
                  }
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  padding: "6px 8px",
                  textAlign: "left",
                  color: "#fff",
                  fontSize: "0.76rem",
                  cursor: "pointer",
                }}
              >
                <strong>विकल्प {idx + 1}:</strong> {c.name} — <span style={{ opacity: 0.7 }}>{c.address}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Products & Services Catalog ─────────────────────────────────── */}
      {hasProducts && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "rgba(255, 255, 255, 0.5)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {isService ? "सेवाएं (Services)" : "खास सामान (Products)"} ({profile.products?.length})
            </span>
          </div>

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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
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
                  {item.item_type === "service" && (
                    <span style={{ fontSize: "0.6rem", color: "#a5b4fc" }}>सेवा</span>
                  )}
                </div>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#ff9933" }}>
                  {item.price !== null && item.price !== undefined
                    ? `₹${item.price.toFixed(0)}${item.unit ? ` / ${item.unit}` : ""}`
                    : "मूल्य उपलब्ध"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Photo / Menu Upload Action ──────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            background: "rgba(255, 153, 51, 0.12)",
            border: "1px dashed rgba(255, 153, 51, 0.4)",
            borderRadius: "12px",
            padding: "10px 14px",
            color: "#ffb366",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: isUploading ? "wait" : "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <span>📸</span>
          {isUploading ? "प्रोसेस हो रहा है..." : "रेट लिस्ट या मेनू की फोटो अपलोड करें"}
        </button>

        {uploadMessage && (
          <p
            style={{
              fontSize: "0.75rem",
              textAlign: "center",
              color: uploadMessage.startsWith("✓") ? "#34d399" : "#ffb366",
              margin: 0,
            }}
          >
            {uploadMessage}
          </p>
        )}
      </div>

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
          <span style={{ color: "#34d399", fontWeight: 600 }}>📞 {profile.phone}</span>
        )}
      </div>

      {/* ── Temporary Website Route Link ───────────────────────────────── */}
      {profile.temp_slug && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, rgba(255,153,51,0.15), rgba(99,102,241,0.15))",
            border: "1px solid rgba(255,153,51,0.3)",
            borderRadius: "12px",
            padding: "10px 14px",
          }}
        >
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#fff" }}>
              🌐 ड्राफ्ट वेबसाइट तैयार है
            </div>
            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.6)" }}>
              /temp/{profile.temp_slug}
            </div>
          </div>
          <Link
            href={`/temp/${profile.temp_slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "#ff9933",
              color: "#000",
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "0.76rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            वेबसाइट देखें ↗
          </Link>
        </div>
      )}
    </div>
  );
}
