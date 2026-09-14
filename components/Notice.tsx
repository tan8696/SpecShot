import type { ReactNode } from "react";

/** Monochrome like the rest of the chrome, so the tone has to be legible
 * without hue: a Material Symbols glyph names it outright, and the three
 * tones sit at different brightnesses so an error still outweighs a tip. */
const TONES = {
  info: { icon: "info", style: "border-outline-variant/50 bg-surface-container/60 text-on-surface-variant" },
  warn: { icon: "warning", style: "border-outline/50 bg-surface-container-high/60 text-on-surface" },
  error: { icon: "error", style: "border-primary/60 bg-surface-container-highest/70 text-on-surface" },
} as const;

export function Notice({ tone, children }: { tone: keyof typeof TONES; children: ReactNode }) {
  const { icon, style } = TONES[tone];
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${style}`}
    >
      <span className="material-symbols-outlined mt-px shrink-0 text-[18px] leading-none" aria-hidden>
        {icon}
      </span>
      <span>{children}</span>
    </p>
  );
}
