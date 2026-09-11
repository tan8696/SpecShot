"use client";

import { useEffect, useRef, useState } from "react";
import { useModalTrap } from "./useModalTrap";
import { getStoredConsent } from "@/lib/consent";

const AD_SECONDS = 15;

// Set both once an AdSense account is approved (see README) — until then
// this renders the placeholder box below instead of an empty/broken ad slot.
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID;

type Phase = "prompt" | "playing" | "done";

/**
 * Free-with-ads unlock. The gate (wait N seconds, then unlock) is our own
 * UI, not something AdSense tracks — the <ins> below is a completely
 * standard display ad unit, just shown while the timer runs. AdSense policy
 * prohibits requiring a *click*, not simply displaying an ad during a wait;
 * onComplete never depends on whether the ad was interacted with.
 */
export function AdGate({ onComplete, onCancel }: { onComplete: () => void; onCancel: () => void }) {
  const [phase, setPhase] = useState<Phase>("prompt");
  const [secondsLeft, setSecondsLeft] = useState(AD_SECONDS);
  // Re-read on mount rather than trusting a module-level constant: consent
  // can change between one ad-gate open and the next without a page reload.
  const [adsConsented, setAdsConsented] = useState(false);
  useEffect(() => setAdsConsented(getStoredConsent() === "accepted"), []);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Escape only cancels during "prompt" — once the ad has started, backing
  // out via Escape would defeat the whole point of the gate, same as there
  // being no Cancel button once it's playing.
  const dialogRef = useModalTrap(phase === "prompt" ? onCancel : null);

  useEffect(() => {
    if (phase !== "playing") return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setPhase("done");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Watch an ad to unlock your download"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl border border-outline-variant/40 bg-surface-container-low p-5 shadow-2xl"
      >
        {phase === "prompt" && (
          <>
            <h2 className="mb-2 font-display text-base font-semibold text-on-surface">
              Watch a short ad to unlock your download
            </h2>
            <p className="mb-4 text-sm text-on-surface-variant">
              SpecShot is free, supported by ads. No account, no payment — just {AD_SECONDS} seconds.
            </p>
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="flex-1 rounded-lg border border-outline-variant/50 px-4 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              >
                Cancel
              </button>
              <button
                onClick={() => setPhase("playing")}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container hover:text-on-primary-container"
              >
                Watch ad
              </button>
            </div>
          </>
        )}

        {phase === "playing" && (
          <>
            <div className="mb-3 flex items-center justify-between text-xs text-outline">
              <span>Advertisement</span>
              <span aria-live="polite">{secondsLeft}s</span>
            </div>
            {ADSENSE_CLIENT && ADSENSE_SLOT && adsConsented ? (
              <AdUnit client={ADSENSE_CLIENT} slot={ADSENSE_SLOT} />
            ) : (
              <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-outline-variant/50 bg-surface-container-lowest text-center text-sm text-outline">
                {ADSENSE_CLIENT
                  ? "No ad to show — you've declined ad cookies. Your download still works the same."
                  : "Ad plays here — set NEXT_PUBLIC_ADSENSE_CLIENT_ID / _SLOT_ID"}
              </div>
            )}
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
              <div
                className="h-full bg-primary transition-all duration-1000 ease-linear"
                style={{ width: `${((AD_SECONDS - secondsLeft) / AD_SECONDS) * 100}%` }}
              />
            </div>
          </>
        )}

        {phase === "done" && (
          <>
            <h2 className="mb-2 font-display text-base font-semibold text-secondary">Unlocked</h2>
            <p className="mb-4 text-sm text-on-surface-variant">Your download is ready.</p>
            <button
              onClick={onComplete}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container hover:text-on-primary-container"
            >
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** A real Google AdSense display unit — the standard <ins class="adsbygoogle">
 * snippet, just as React. Requires the loader script (app/layout.tsx) to
 * already be on the page. */
function AdUnit({ client, slot }: { client: string; slot: string }) {
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    try {
      ((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle ??= []).push({});
    } catch {
      // Ad blocked or script not loaded yet — the box just stays empty.
    }
  }, []);

  return (
    <ins
      ref={insRef}
      className="adsbygoogle"
      style={{ display: "block", minHeight: 224 }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
