"use client";

import { useEffect, useState } from "react";
import { APP_DOWNLOAD_URL } from "@/lib/site";

// Stable asset names (set in .github/workflows/apps.yml) so "latest" always
// resolves to the newest release without touching this file.
const RELEASES = `${APP_DOWNLOAD_URL}/download`;
const APPS = {
  windows: { href: `${RELEASES}/SpecShot-Setup.exe`, label: "Windows", icon: "laptop_windows" },
  android: { href: `${RELEASES}/SpecShot.apk`, label: "Android", icon: "android" },
} as const;
const DISMISSED = "specshot:app-prompt-dismissed";

type Platform = keyof typeof APPS | "other";

/** First-visit toast telling visitors the site also comes as a Windows and
 * Android app. Dismissal is remembered per browser. Never rendered inside
 * the apps themselves — their build sets NEXT_PUBLIC_NATIVE_APP. */
export function AppDownloadPrompt() {
  const [platform, setPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED)) return;
    } catch {
      // Storage blocked — still show it; it just can't stay dismissed.
    }
    const ua = navigator.userAgent;
    // iOS can't sideload either app, and an installed PWA already is the app.
    if (/iPhone|iPad|iPod/.test(ua) || matchMedia("(display-mode: standalone)").matches) return;
    setPlatform(/Android/.test(ua) ? "android" : /Windows/.test(ua) ? "windows" : "other");
  }, []);

  if (process.env.NEXT_PUBLIC_NATIVE_APP || !platform) return null;

  function dismiss() {
    setPlatform(null);
    try {
      localStorage.setItem(DISMISSED, "1");
    } catch {}
  }

  // The visitor's own platform first; the other one is still offered.
  const order: (keyof typeof APPS)[] = platform === "windows" ? ["windows", "android"] : ["android", "windows"];

  return (
    <div
      role="dialog"
      aria-labelledby="app-prompt-title"
      className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 mx-auto max-w-sm motion-safe:animate-[app-prompt-in_300ms_ease-out] rounded-2xl border border-outline-variant/40 bg-surface-container-low/95 p-4 shadow-2xl backdrop-blur-xl sm:left-auto sm:right-6 sm:mx-0"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container font-display text-sm font-bold text-on-primary-container">
          S
        </span>
        <div className="min-w-0 flex-1">
          <p id="app-prompt-title" className="font-display text-base font-semibold text-on-surface">
            Get SpecShot as an app
          </p>
          <p className="mt-0.5 text-sm text-on-surface-variant">
            Same free tools, works offline, nothing uploaded.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-outline transition-colors hover:bg-surface-container-high hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        {order.map((key, i) => {
          const app = APPS[key];
          const primary = i === 0 && platform !== "other";
          return (
            <a
              key={key}
              href={app.href}
              onClick={dismiss}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                primary
                  ? "bg-primary-container text-on-primary-container hover:bg-primary"
                  : "border border-outline-variant/50 text-on-surface hover:bg-surface-container-high"
              }`}
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">{app.icon}</span>
              {app.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}
