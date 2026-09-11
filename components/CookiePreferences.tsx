"use client";

import { useEffect, useState } from "react";
import { clearStoredConsent, getStoredConsent, type ConsentValue } from "@/lib/consent";

/** Shows the visitor's current ad-cookie choice and lets them reset it —
 * clearing the stored flag and reloading re-shows ConsentGate's banner. */
export function CookiePreferences() {
  const [consent, setConsent] = useState<ConsentValue | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setConsent(getStoredConsent());
    setChecked(true);
  }, []);

  if (!checked) return null;

  const label = consent === "accepted" ? "Accepted" : consent === "declined" ? "Declined" : "Not yet chosen";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-container-low p-3">
      <p>
        Your current choice: <span className="font-medium text-on-surface">{label}</span>
      </p>
      <button
        onClick={() => {
          clearStoredConsent();
          window.location.reload();
        }}
        className="rounded-lg bg-surface-container px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-high"
      >
        Reset my choice
      </button>
    </div>
  );
}
