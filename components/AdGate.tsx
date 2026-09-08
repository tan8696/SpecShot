"use client";

import { useEffect, useRef, useState } from "react";
import { useModalTrap } from "./useModalTrap";

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
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        {phase === "prompt" && (
          <>
            <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">
              Watch a short ad to unlock your download
            </h2>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              SpecShot is free, supported by ads. No account, no payment — just {AD_SECONDS} seconds.
            </p>
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => setPhase("playing")}
                className="flex-1 rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
              >
                Watch ad
              </button>
            </div>
          </>
        )}

        {phase === "playing" && (
          <>
            <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
              <span>Advertisement</span>
              <span aria-live="polite">{secondsLeft}s</span>
            </div>
            {ADSENSE_CLIENT && ADSENSE_SLOT ? (
              <AdUnit client={ADSENSE_CLIENT} slot={ADSENSE_SLOT} />
            ) : (
              <div className="flex h-56 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950">
                Ad plays here — set NEXT_PUBLIC_ADSENSE_CLIENT_ID / _SLOT_ID
              </div>
            )}
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full bg-indigo-500 transition-all duration-1000 ease-linear"
                style={{ width: `${((AD_SECONDS - secondsLeft) / AD_SECONDS) * 100}%` }}
              />
            </div>
          </>
        )}

        {phase === "done" && (
          <>
            <h2 className="mb-2 text-base font-semibold text-emerald-600 dark:text-emerald-400">Unlocked</h2>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">Your download is ready.</p>
            <button
              onClick={onComplete}
              className="w-full rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
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
