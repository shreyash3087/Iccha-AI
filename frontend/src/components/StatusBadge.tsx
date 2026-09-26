"use client";

/**
 * StatusBadge — displays the current agent/connection state.
 *
 * States map directly to the LiveKit AgentSession lifecycle:
 *   connecting  → waiting for WebRTC + agent to join
 *   listening   → VAD detected speech from user
 *   thinking    → LLM is generating a response
 *   speaking    → TTS is synthesizing + agent is publishing audio
 *   idle        → session active, waiting for user to speak
 *   error       → something went wrong
 */

export type AgentStatus =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "error";

interface StatusBadgeProps {
  status: AgentStatus;
}

const STATUS_CONFIG: Record<
  AgentStatus,
  { label: string; hindiLabel: string; color: string; dotColor: string; pulse: boolean }
> = {
  idle: {
    label: "Ready",
    hindiLabel: "बोलिए...",
    color: "rgba(255,255,255,0.08)",
    dotColor: "rgba(255,255,255,0.4)",
    pulse: false,
  },
  connecting: {
    label: "Connecting",
    hindiLabel: "जुड़ रहे हैं...",
    color: "rgba(245, 158, 11, 0.15)",
    dotColor: "var(--color-status-connecting)",
    pulse: true,
  },
  listening: {
    label: "Listening",
    hindiLabel: "सुन रहे हैं",
    color: "rgba(16, 185, 129, 0.12)",
    dotColor: "var(--color-status-listening)",
    pulse: true,
  },
  thinking: {
    label: "Thinking",
    hindiLabel: "सोच रहे हैं...",
    color: "rgba(99, 102, 241, 0.15)",
    dotColor: "var(--color-status-thinking)",
    pulse: true,
  },
  speaking: {
    label: "Speaking",
    hindiLabel: "बोल रहे हैं",
    color: "rgba(255, 153, 51, 0.12)",
    dotColor: "var(--color-saffron)",
    pulse: false,
  },
  error: {
    label: "Error",
    hindiLabel: "कुछ गड़बड़ हुई",
    color: "rgba(239, 68, 68, 0.12)",
    dotColor: "var(--color-status-error)",
    pulse: false,
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 16px",
        background: config.color,
        border: `1px solid ${config.dotColor}30`,
        borderRadius: "var(--radius-full)",
        transition: "all var(--transition-base)",
      }}
      role="status"
      aria-live="polite"
      aria-label={`Agent status: ${config.label}`}
    >
      {/* Status dot with optional pulse */}
      <span style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: config.dotColor,
            display: "block",
            transition: "background var(--transition-base)",
          }}
        />
        {config.pulse && (
          <span
            style={{
              position: "absolute",
              inset: -3,
              borderRadius: "50%",
              border: `1.5px solid ${config.dotColor}`,
              animation: "pulse-ring 1.5s ease-out infinite",
            }}
          />
        )}
      </span>

      {/* Bilingual label */}
      <span
        style={{
          fontSize: "0.8rem",
          fontWeight: 500,
          color: "var(--color-text-secondary)",
          letterSpacing: "0.02em",
        }}
      >
        {config.hindiLabel}
      </span>
    </div>
  );
}
