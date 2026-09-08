import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";

// No production domain is registered yet — set this in the host's env vars
// before launch. Falls back to a placeholder so metadataBase/sitemap/robots
// never build an invalid URL in local dev or a preview build.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://specshot.example";
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
  themeColor: "#6366f1",
};

// Runs before hydration so the correct theme applies on first paint — doing
// this in a useEffect instead would flash the wrong theme for a frame.
// Defaults to the visitor's OS preference; a saved manual choice wins after.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var dark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-slate-900 antialiased dark:bg-[#05070f] dark:text-slate-100">
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
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
