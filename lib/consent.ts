/** Ad-cookie consent: one flag in localStorage. No stored choice (or
 * "declined") means no AdSense script ever loads and no ad cookie is ever
 * set — the ad-gate's own 15-second wait still runs either way, since that
 * mechanism was never Google's to begin with (see AdGate.tsx). */
const KEY = "specshot:ad-consent";
export type ConsentValue = "accepted" | "declined";

export function getStoredConsent(): ConsentValue | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "accepted" || v === "declined" ? v : null;
  } catch {
    return null;
  }
}

export function setStoredConsent(value: ConsentValue) {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    // Private browsing or storage disabled — the banner just reappears next
    // visit, which is the safe default (no consent assumed either way).
  }
}

export function clearStoredConsent() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear if storage never worked in the first place.
  }
}
