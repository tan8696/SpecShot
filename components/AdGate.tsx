"use client";

import { useEffect, useRef, useState } from "react";
import { useModalTrap } from "./useModalTrap";

const AD_SECONDS = 15;

type Phase = "prompt" | "playing" | "done";

/**
 * Free-with-ads unlock. This is the placeholder ad slot — swap the "Ad plays
 * here" box for a real network's rewarded-ad tag (Google Ad Manager, AdMob
 * web, etc.) and call onComplete from that network's reward callback instead
 * of the countdown timer.
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
            {/* AD SLOT: real ad network markup/script goes here. */}
            <div className="flex h-56 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950">
              Ad plays here
            </div>
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
