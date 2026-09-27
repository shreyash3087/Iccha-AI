"use client";

/**
 * StatusBadge — displays the current agent/connection state.
 * Uses pure Tailwind CSS utilities for responsive, accessible badge styling.
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
  variant?: "dark" | "light";
}

const STATUS_CONFIG: Record<
  AgentStatus,
  { label: string; hindiLabel: string; darkClass: string; lightClass: string; dotClass: string; pulse: boolean }
> = {
  idle: {
    label: "Ready",
    hindiLabel: "बोलिए...",
    darkClass: "bg-white/5 border-white/10 text-white/70",
    lightClass: "bg-slate-100 border-slate-200 text-slate-700",
    dotClass: "bg-slate-400",
    pulse: false,
  },
  connecting: {
    label: "Connecting",
    hindiLabel: "जुड़ रहे हैं...",
    darkClass: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    lightClass: "bg-amber-50 border-amber-200 text-amber-800",
    dotClass: "bg-amber-500",
    pulse: true,
  },
  listening: {
    label: "Listening",
    hindiLabel: "सुन रहे हैं",
    darkClass: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
    lightClass: "bg-emerald-50 border-emerald-200 text-emerald-800",
    dotClass: "bg-emerald-500",
    pulse: true,
  },
  thinking: {
    label: "Thinking",
    hindiLabel: "सोच रहे हैं...",
    darkClass: "bg-indigo-500/10 border-indigo-500/30 text-indigo-300",
    lightClass: "bg-indigo-50 border-indigo-200 text-indigo-800",
    dotClass: "bg-indigo-500",
    pulse: true,
  },
  speaking: {
    label: "Speaking",
    hindiLabel: "बोल रहे हैं",
    darkClass: "bg-orange-500/10 border-orange-500/30 text-orange-300",
    lightClass: "bg-orange-50 border-orange-200 text-orange-800",
    dotClass: "bg-orange-500",
    pulse: false,
  },
  error: {
    label: "Error",
    hindiLabel: "कुछ गड़बड़ हुई",
    darkClass: "bg-rose-500/10 border-rose-500/30 text-rose-300",
    lightClass: "bg-rose-50 border-rose-200 text-rose-800",
    dotClass: "bg-rose-500",
    pulse: false,
  },
};

export function StatusBadge({ status, variant = "dark" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const isLight = variant === "light";
  const themeClass = isLight ? config.lightClass : config.darkClass;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all duration-200 text-xs font-semibold tracking-wide ${themeClass}`}
      role="status"
      aria-live="polite"
      aria-label={`Agent status: ${config.label}`}
    >
      {/* Status dot with optional pulse ring */}
      <span className="relative flex items-center justify-center">
        <span className={`w-2 h-2 rounded-full block transition-colors duration-200 ${config.dotClass}`} />
        {config.pulse && (
          <span className={`absolute -inset-1 rounded-full border border-current opacity-60 animate-ping`} />
        )}
      </span>

      {/* Bilingual label */}
      <span>{config.hindiLabel}</span>
    </div>
  );
}
