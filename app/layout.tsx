import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { PageBackground } from "@/components/PageBackground";
import { AppDownloadPrompt } from "@/components/AppDownloadPrompt";
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
// Google Analytics 4 measurement ID (G-XXXXXXXXXX) and the Search Console
// "HTML tag" verification token. Both unset = nothing loads/renders.
const GA_ID = /^G-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GA_ID ?? "") ? process.env.NEXT_PUBLIC_GA_ID : undefined;
const GSC_VERIFICATION = process.env.NEXT_PUBLIC_GSC_VERIFICATION;
// GA4 consent defaults: denied in the EEA/UK/CH until Google's consent
// message (the same one AdSense uses) grants it; granted elsewhere.
const GA_CONSENT_REGIONS = "AT,BE,BG,HR,CY,CZ,DK,EE,FI,FR,DE,GR,HU,IS,IE,IT,LV,LI,LT,LU,MT,NL,NO,PL,PT,RO,SK,SI,ES,SE,GB,CH"
  .split(",");

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
  ...(GSC_VERIFICATION ? { verification: { google: GSC_VERIFICATION } } : {}),
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
        {/* Axes pinned to the one setting globals.css uses (.material-symbols-outlined):
            the full variable range is a ~4 MB font, this is ~320 KB. */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block"
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
        {GA_ID && !process.env.NEXT_PUBLIC_NATIVE_APP && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',region:${JSON.stringify(GA_CONSENT_REGIONS)}});
gtag('js',new Date());gtag('config','${GA_ID}');`,
              }}
            />
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
          </>
        )}
      </head>
      <body className="min-h-screen bg-surface font-body text-on-surface antialiased">
        {/* The topographic contour field every page sits on. Fixed and
            pointer-transparent, so it never affects page layout. */}
        <PageBackground />
        {children}
        <AppDownloadPrompt />
        {/* Vercel Web Analytics — cookieless, no IP storage, counts page
            views in aggregate only. See app/privacy/page.tsx for the
            disclosure. It needs no consent: it sets no cookie and can't
            identify a visitor, so there's nothing to opt into or out of.
            Left out of the apps: they have no /_vercel endpoint to report to. */}
        {!process.env.NEXT_PUBLIC_NATIVE_APP && <Analytics />}
      </body>
    </html>
  );
}
