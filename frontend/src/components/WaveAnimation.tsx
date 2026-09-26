"use client";

/**
 * WaveAnimation — CSS-only audio waveform visualiser.
 *
 * 5 animated bars that reflect agent/user state.
 * Zero JS animation — all via CSS @keyframes defined in globals.css.
 * This is intentional: we want zero JavaScript overhead during active audio.
 */

interface WaveAnimationProps {
  /** Whether the agent is actively speaking */
  isSpeaking?: boolean;
  /** Whether the user's mic is active and we're listening */
  isListening?: boolean;
  className?: string;
}

export function WaveAnimation({
  isSpeaking = false,
  isListening = false,
  className = "",
}: WaveAnimationProps) {
  return (
    <div
      className={`waveform ${className}`}
      data-speaking={isSpeaking}
      data-listening={isListening}
      role="img"
      aria-label={
        isSpeaking
          ? "Agent is speaking"
          : isListening
            ? "Listening to you"
            : "Idle"
      }
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="waveform__bar" />
      ))}
    </div>
  );
}
