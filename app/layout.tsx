import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Inter } from "next/font/google";
import Script from "next/script";
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
};

export const viewport: Viewport = {
  themeColor: "#0e0e10",
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
      </head>
      <body className="min-h-screen bg-surface font-body text-on-surface antialiased">
        {ADSENSE_CLIENT && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
        {children}
      </body>
    </html>
  );
}
