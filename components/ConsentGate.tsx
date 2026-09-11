"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { getStoredConsent, setStoredConsent, type ConsentValue } from "@/lib/consent";

/**
 * Loads the Google AdSense script only after the visitor accepts ad cookies,
 * and shows the banner asking until they choose. Replaces an unconditional
 * <Script> in app/layout.tsx: reading localStorage needs a client component,
 * and gating the *load* (not just the ad unit) is what actually stops the
 * cookie from being set on a decline. If AdSense isn't configured at all
 * there's nothing to ask about, so this renders nothing.
 */
export function ConsentGate({ clientId }: { clientId?: string }) {
  const [consent, setConsent] = useState<ConsentValue | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setConsent(getStoredConsent());
    setChecked(true);
  }, []);

  if (!clientId || !checked) return null;

  if (consent === "accepted") {
    return (
      <Script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
    );
  }

  if (consent === "declined") return null;

  function choose(value: ConsentValue) {
    setStoredConsent(value);
    setConsent(value);
  }

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant/40 bg-surface-container-low/95 p-4 font-body text-on-surface backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-on-surface-variant">
          SpecShot is free, supported by ads. If you accept, Google AdSense may set cookies to show
          ads based on your visits here and elsewhere — see the{" "}
          <Link href="/cookies/" className="text-primary underline hover:text-primary-fixed">
            Cookie Policy
          </Link>
          . Your photos are never affected either way — they never leave your browser.
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => choose("declined")}
            className="rounded-lg border border-outline-variant/50 px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            Decline
          </button>
          <button
            onClick={() => choose("accepted")}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container hover:text-on-primary-container"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
