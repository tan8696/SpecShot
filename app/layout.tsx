import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { PageBackground } from "@/components/PageBackground";
import "./globals.css";

// Geist for display type, Inter for body — used only by the landing page via
// the --font-display / --font-body theme tokens (app/globals.css). next/font
// self-hosts them, so no render-blocking Google Fonts request.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

// No production domain is registered yet — set this in the host's env vars
// before launch. Falls back to a placeholder so metadataBase/sitemap/robots
// never build an invalid URL in local dev or a preview build.
// Trailing slash trimmed so `${SITE_URL}/path` concatenation (sitemap.ts,
// robots.ts) can't produce `https://host//path` when the env var is set with
// one — as it was on the first Vercel deploy.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://specshot.example").replace(/\/+$/, "");
const DESCRIPTION = "Turn a selfie into an ID photo that meets an exact spec. Processed entirely in your browser.";
// Unset until an AdSense account is approved — see README "Before you go
// live". No ad script loads at all until then, so there's nothing to review
// or accidentally serve broken/unapproved ad calls with.
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "SpecShot",
  description: DESCRIPTION,
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    title: "SpecShot",
    description: DESCRIPTION,
    siteName: "SpecShot",
  },
  twitter: {
    card: "summary",
    title: "SpecShot",
    description: DESCRIPTION,
  },
  // AdSense ownership verification — the method the site was connected with.
  ...(ADSENSE_CLIENT ? { other: { "google-adsense-account": ADSENSE_CLIENT } } : {}),
};

export const viewport: Viewport = {
  themeColor: "#131313",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // Dark-only: the studio palette IS the design, so `dark` is pinned on and
    // there's no theme toggle or first-paint theme script any more.
    <html lang="en" className={`dark ${geist.variable} ${inter.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        {/* AdSense's snippet as-is, on every page. A plain <script>, not
            next/script, so it sits in the static HTML exactly as AdSense
            gives it (next/script would inject it after hydration). Consent
            where the law requires it (EEA/UK/CH) is Google's own message,
            set up under AdSense → Privacy & messaging and delivered by this
            same script. */}
        {ADSENSE_CLIENT && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="min-h-screen bg-surface font-body text-on-surface antialiased">
        {/* The topographic contour field every page sits on. Fixed and
            pointer-transparent, so it never affects page layout. */}
        <PageBackground />
        {children}
        {/* Vercel Web Analytics — cookieless, no IP storage, counts page
            views in aggregate only. See app/privacy/page.tsx for the
            disclosure. It needs no consent: it sets no cookie and can't
            identify a visitor, so there's nothing to opt into or out of. */}
        <Analytics />
      </body>
    </html>
  );
}
