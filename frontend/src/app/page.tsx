import type { Metadata } from "next";
import { VoiceSession } from "@/components/VoiceSession";

export const metadata: Metadata = {
  title: "ICCHA AI — अपनी दुकान की वेबसाइट बनाएं, सिर्फ बोलकर",
  description:
    "बस अपनी दुकान के बारे में बोलिए — ICCHA AI आपके लिए एक पूरी वेबसाइट बना देगा। " +
    "Hindi-first AI for Indian small businesses.",
};

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo mark */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              background:
                "linear-gradient(135deg, var(--color-saffron), #e8851f)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: 700,
              color: "#000",
              flexShrink: 0,
            }}
          >
            इ
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: "1.1rem",
              letterSpacing: "-0.02em",
              color: "var(--color-text-primary)",
            }}
          >
            ICCHA AI
          </span>
        </div>

        {/* Phase badge */}
        <div
          style={{
            padding: "5px 12px",
            background: "var(--color-saffron-dim)",
            border: "1px solid rgba(255,153,51,0.25)",
            borderRadius: "var(--radius-full)",
            fontSize: "0.72rem",
            fontWeight: 600,
            color: "var(--color-saffron-light)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Phase 3 · Live Website Creation
        </div>
      </header>

      {/* ── Hero Section ────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "20px",
          maxWidth: "1040px",
          width: "100%",
        }}
      >
        {/* Eyebrow label */}
        <div
          className="animate-fade-in-up animate-fade-in-up-delay-1"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            background: "var(--color-indigo-dim)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: "var(--radius-full)",
            fontSize: "0.78rem",
            fontWeight: 500,
            color: "var(--color-indigo-light)",
          }}
        >
          <span style={{ fontSize: "0.7rem" }}>🇮🇳</span>
          Hindi-first · हिंदी में बात करें
        </div>

        {/* Main heading */}
        <h1
          className="animate-fade-in-up animate-fade-in-up-delay-2"
          style={{
            fontSize: "clamp(2rem, 5vw, 3.2rem)",
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            color: "var(--color-text-primary)",
          }}
        >
          अपनी दुकान की{" "}
          <span
            style={{
              background:
                "linear-gradient(135deg, var(--color-saffron), var(--color-saffron-light))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            वेबसाइट
          </span>{" "}
          <br />
          <span style={{ color: "var(--color-text-secondary)" }}>
            बस बोलकर बनाएं
          </span>
        </h1>

        {/* Sub heading */}
        <p
          className="animate-fade-in-up animate-fade-in-up-delay-2"
          style={{
            fontSize: "clamp(1rem, 2.5vw, 1.15rem)",
            color: "var(--color-text-secondary)",
            lineHeight: 1.7,
            maxWidth: "480px",
          }}
        >
          अपनी दुकान का नाम, सामान, और समय बोलिए —{" "}
          <strong style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>
            ICCHA AI
          </strong>{" "}
          आपके लिए एक पूरी वेबसाइट तैयार कर देगा।
          <br />
          <span style={{ fontSize: "0.9em" }}>
            No typing. No design skills needed.
          </span>
        </p>

        {/* ── Main CTA — Voice Session ──────────────────────────────────── */}
        <div
          className="animate-fade-in-up animate-fade-in-up-delay-3"
          style={{
            marginTop: "12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            width: "100%",
          }}
        >
          <VoiceSession />

          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--color-text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            माइक की अनुमति जरूरी है · Mic permission required
          </p>
        </div>

        {/* ── Feature Pills ─────────────────────────────────────────────── */}
        <div
          className="animate-fade-in-up animate-fade-in-up-delay-3"
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "10px",
            marginTop: "16px",
          }}
        >
          {[
            { icon: "🎙️", text: "Hindi · Hinglish" },
            { icon: "⚡", text: "< 500ms response" },
            { icon: "🏪", text: "Google Maps linked" },
            { icon: "📱", text: "Mobile ready" },
          ].map(({ icon, text }) => (
            <div
              key={text}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-full)",
                fontSize: "0.78rem",
                color: "var(--color-text-secondary)",
                fontWeight: 500,
              }}
            >
              <span>{icon}</span>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
          fontSize: "0.72rem",
          color: "var(--color-text-muted)",
        }}
      >
        <span>Powered by LiveKit · Phase 3 — Voice Website Generator</span>
      </footer>
    </main>
  );
}
