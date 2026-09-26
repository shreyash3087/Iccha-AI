import { notFound } from "next/navigation";
import fs from "fs/promises";
import path from "path";
import Link from "next/link";
import type { BusinessProfile } from "@/types/business";

interface TempPageProps {
  params: Promise<{ slug: string }>;
}

async function getProfile(slug: string): Promise<BusinessProfile | null> {
  try {
    const filePath = path.join(process.cwd(), "public", "temp_sites", `${slug}.json`);
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    // If not on disk yet, return fallback mock with the slug
    return {
      shop_name: "आपकी दुकान",
      temp_slug: slug,
      temp_url: `/temp/${slug}`,
      locality: "भारत",
      category: "kirana",
      products: [],
    };
  }
}

export default async function TempWebsitePage({ params }: TempPageProps) {
  const { slug } = await params;
  const profile = await getProfile(slug);

  if (!profile) {
    notFound();
  }

  const isService = profile.business_type === "service";
  const items = profile.products || [];
  const hours = profile.hours;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#0c0d14",
        color: "#ffffff",
        fontFamily: "'Inter', 'Noto Sans Devanagari', sans-serif",
      }}
    >
      {/* ── Draft Mode Notification Bar ─────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(90deg, #ff9933, #e8851f)",
          color: "#000",
          padding: "10px 16px",
          fontSize: "0.84rem",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>✨</span>
          <span>
            ड्राफ्ट वेबसाइट पूर्वावलोकन (Preview Mode) · URL: <code>/temp/{slug}</code>
          </span>
        </div>
        <Link
          href="/"
          style={{
            background: "rgba(0,0,0,0.8)",
            color: "#fff",
            padding: "4px 12px",
            borderRadius: "9999px",
            fontSize: "0.78rem",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          ← वापस जाएं
        </Link>
      </div>

      {/* ── Store Header & Hero ─────────────────────────────────────────── */}
      <header
        style={{
          padding: "48px 24px 36px",
          background: "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(255,153,51,0.15), transparent 70%)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ maxWidth: "1040px", margin: "0 auto", textAlign: "center" }}>
          {/* Business Type Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "9999px",
              fontSize: "0.76rem",
              color: "rgba(255,255,255,0.7)",
              marginBottom: "16px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            <span>{isService ? "🛠️ सेवा केंद्र / Service Center" : "🏪 स्टोर / Retail Shop"}</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: "12px",
            }}
          >
            {profile.shop_name}
          </h1>

          {profile.tagline && (
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1.05rem", marginBottom: "16px" }}>
              {profile.tagline}
            </p>
          )}

          {/* Location & Google Maps Verification Badge */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              fontSize: "0.88rem",
              color: "rgba(255,255,255,0.6)",
              marginBottom: "28px",
            }}
          >
            {profile.address && (
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span>📍</span> {profile.address}
              </span>
            )}
            {profile.verified_via_places ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "rgba(16,185,129,0.15)",
                  color: "#34d399",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  border: "1px solid rgba(16,185,129,0.3)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                }}
              >
                ✓ Google Verified {profile.rating ? `· ${profile.rating}★` : ""}
              </span>
            ) : profile.wants_google_review_help ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "rgba(99,102,241,0.15)",
                  color: "#a5b4fc",
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  border: "1px solid rgba(99,102,241,0.3)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                }}
              >
                ⭐ Google Review प्रोफ़ाइल सक्रिय
              </span>
            ) : null}
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
            {profile.phone && (
              <a
                href={`tel:${profile.phone}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "linear-gradient(135deg, #ff9933, #e8851f)",
                  color: "#000",
                  padding: "12px 24px",
                  borderRadius: "14px",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  textDecoration: "none",
                }}
              >
                <span>📞</span> अभी कॉल करें ({profile.phone})
              </a>
            )}
            {profile.whatsapp && (
              <a
                href={`https://wa.me/91${profile.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#25d366",
                  color: "#000",
                  padding: "12px 24px",
                  borderRadius: "14px",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  textDecoration: "none",
                }}
              >
                <span>💬</span> WhatsApp पर ऑर्डर करें
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Catalog / Offerings Section ────────────────────────────── */}
      <main style={{ maxWidth: "1040px", margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "4px" }}>
              {isService ? "🔧 हमारी मुख्य सेवाएं (Our Services)" : "🛍️ मुख्य सामान और रेट (Products & Pricing)"}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.88rem" }}>
              दुकानदार द्वारा सीधे सत्यापित रेट सूची
            </p>
          </div>
          <span
            style={{
              padding: "4px 12px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: "9999px",
              fontSize: "0.8rem",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            {items.length} {isService ? "सेवाएं" : "आइटम्स"}
          </span>
        </div>

        {items.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              background: "rgba(255,255,255,0.02)",
              borderRadius: "16px",
              border: "1px dashed rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            <p>अभी कोई सामान या सेवा नहीं जोड़ी गई है।</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {items.map((it, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "14px",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>{it.name}</h3>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        padding: "2px 8px",
                        background: it.item_type === "service" ? "rgba(99,102,241,0.2)" : "rgba(255,153,51,0.2)",
                        color: it.item_type === "service" ? "#a5b4fc" : "#ffb366",
                        borderRadius: "9999px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      {it.item_type === "service" ? "सेवा" : "प्रोडक्ट"}
                    </span>
                  </div>
                  {it.description && (
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.82rem", marginTop: "6px" }}>
                      {it.description}
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
                  <div>
                    {it.price !== null && it.price !== undefined ? (
                      <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ffb366" }}>
                        ₹{it.price.toLocaleString("en-IN")}
                        {it.unit && (
                          <span style={{ fontSize: "0.78rem", fontWeight: 400, color: "rgba(255,255,255,0.5)", marginLeft: "4px" }}>
                            / {it.unit}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>मूल्य पूछें</span>
                    )}
                  </div>
                  {profile.whatsapp && (
                    <a
                      href={`https://wa.me/91${profile.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`नमस्ते, मुझे "${it.name}" चाहिए।`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: "rgba(37,211,102,0.15)",
                        border: "1px solid rgba(37,211,102,0.3)",
                        color: "#34d399",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      ऑर्डर करें
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Operational Hours & Details ───────────────────────────────── */}
        {hours && (
          <div
            style={{
              marginTop: "48px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "16px",
              padding: "24px",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "20px",
            }}
          >
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "4px" }}>
                ⏰ दुकान खुलने का समय (Store Timings)
              </h3>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9rem" }}>
                {hours.open_time || "09:00 AM"} से {hours.close_time || "09:00 PM"}
                {hours.closed_days && hours.closed_days.length > 0 && (
                  <span style={{ color: "#ef4444", marginLeft: "8px" }}>
                    ({hours.closed_days.join(", ")} बंद)
                  </span>
                )}
              </p>
            </div>
            {profile.offers && profile.offers.length > 0 && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {profile.offers.map((offer, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: "rgba(255,153,51,0.1)",
                      border: "1px solid rgba(255,153,51,0.25)",
                      color: "#ffb366",
                      padding: "6px 12px",
                      borderRadius: "9999px",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                    }}
                  >
                    🎉 {offer}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "24px",
          textAlign: "center",
          color: "rgba(255,255,255,0.4)",
          fontSize: "0.8rem",
        }}
      >
        <p>
          {profile.shop_name} · Powered by{" "}
          <strong style={{ color: "var(--color-saffron, #ff9933)" }}>ICCHA AI</strong> — अपनी दुकान की वेबसाइट बनाएं, सिर्फ बोलकर
        </p>
      </footer>
    </div>
  );
}
