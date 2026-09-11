/** Shared chrome for the "studio" tool panels (CompressTool, ResizeTool …):
 * the dark Material-3 look from app/globals.css, telemetry-style stat pills,
 * and size formatting. Presentational only — no hooks, safe to import into any
 * client component. */

export function formatKb(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(0)} KB`;
}

export function formatBytes(bytes: number): string {
  return formatKb(bytes / 1024);
}

type Tone = "primary" | "secondary" | "warn" | "neutral";

export function StatPill({
  icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: string;
  label: string;
  value: string;
  tone?: Tone;
}) {
  const color =
    tone === "primary"
      ? "text-primary"
      : tone === "secondary"
        ? "text-secondary"
        : tone === "warn"
          ? "text-amber-400"
          : "text-on-surface";
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-surface-container-lowest px-2.5 py-1">
      <span className={`material-symbols-outlined text-[15px] ${color}`}>{icon}</span>
      <span className="text-[10px] uppercase tracking-wider text-outline">{label}</span>
      <span className={`font-mono text-xs font-medium ${color}`}>{value}</span>
    </div>
  );
}

/** The outer dark card every studio panel sits in. */
export const STUDIO_FRAME =
  "space-y-4 rounded-2xl bg-surface-container-lowest p-4 font-body text-on-surface shadow-2xl sm:p-6";

/** Loading cover for a stage `<canvas>` that's drawn to imperatively — an
 * encode→decode round trip (canvas → blob → Image → canvas) lands the first
 * pixels asynchronously, unlike a React-owned `<img src>` that has a natural
 * "nothing yet" state. Until that first draw lands the canvas is genuinely
 * blank/transparent, which on every tool's black viewport reads as a dead
 * black box rather than "still working". Render as a sibling of the canvas
 * inside a `relative` wrapper; pair with `invisible` (not `hidden`, so the
 * ref stays mounted) on the canvas itself while `show` is true. */
export function CanvasLoading({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="material-symbols-outlined animate-spin text-[28px] text-primary">progress_activity</span>
    </div>
  );
}

/** Honest, always-true reassurance line for the studio tools — the real
 * version of the mockups' "WASM / Zero Server" theatre. Canvas re-encoding
 * drops EXIF/GPS as a side effect, so the metadata claim is free and true. */
export function StudioPrivacyNote() {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-outline">
      <span className="inline-flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[14px] text-secondary">lock</span>
        Runs in your browser — the file is never uploaded
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[14px] text-secondary">location_off</span>
        Camera &amp; location metadata (EXIF/GPS) removed on save
      </span>
    </p>
  );
}
