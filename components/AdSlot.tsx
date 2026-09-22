"use client";

import { useEffect } from "react";

// Both set in production — the slot is committed in .env.production. Without
// both, nothing renders.
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID;

/** One standard AdSense display unit in the page flow, above each tool's
 * how-to section. Nothing waits on it and nothing asks anyone to look at it:
 * AdSense bans asking people to view ads or rewarding them for it, so every
 * download is free and instant. Until AdSense fills it the block takes no
 * space — no margin, no label — and it hides outright if AdSense marks it
 * data-ad-status="unfilled", so there's never an empty gap. */
export function AdSlot() {
  if (!ADSENSE_CLIENT || !ADSENSE_SLOT) return null;
  return <AdUnit client={ADSENSE_CLIENT} slot={ADSENSE_SLOT} />;
}

function AdUnit({ client, slot }: { client: string; slot: string }) {
  useEffect(() => {
    try {
      ((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle ??= []).push({});
    } catch {
      // Ad blocked — the unit just stays empty.
    }
  }, []);

  return (
    <aside
      aria-label="Advertisement"
      className="group has-[[data-ad-status=filled]]:mt-12 has-[[data-ad-status=unfilled]]:hidden"
    >
      <p className="mb-1 hidden text-[11px] uppercase tracking-wider text-outline group-has-[[data-ad-status=filled]]:block">
        Advertisements
      </p>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
