import type { MetadataRoute } from "next";
import { loadSpecs } from "@/lib/specs";
import { TOOLS } from "@/lib/tools";

// Required for `output: "export"` — Next treats file-convention metadata
// routes as dynamic-capable by default; this opts them into static export.
export const dynamic = "force-static";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://specshot.example";

export default function sitemap(): MetadataRoute.Sitemap {
  // The nav lists the most-searched of each pair (/heic-to-jpg, /jpg-to-pdf,
  // /pdf-to-jpg); the siblings are standalone SEO pages not in TOOLS, so
  // they're listed here by hand.
  const staticRoutes = [
    "/",
    "/business/",
    "/photo/",
    "/privacy/",
    "/terms/",
    "/tools/",
    "/heic-to-png/",
    "/png-to-pdf/",
    "/pdf-to-png/",
  ].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
  }));

  // Only tools with a real standalone route belong here — entries like
  // "/?tool=compress" are query params on the homepage, not a distinct page.
  const toolRoutes = TOOLS.filter((t) => t.href.startsWith("/") && !t.href.includes("?") && t.href !== "/").map((t) => ({
    url: `${SITE_URL}${t.href}`,
    lastModified: new Date(),
  }));

  // loadSpecs() already excludes unverified specs in a production build
  // (lib/specs.ts), the same gate generateStaticParams uses — so this can
  // never list a slug that doesn't actually have a page.
  const specRoutes = loadSpecs().map((s) => ({
    url: `${SITE_URL}/photo/${s.slug}/`,
    lastModified: s.verified_on ? new Date(s.verified_on) : new Date(),
  }));

  return [...staticRoutes, ...toolRoutes, ...specRoutes];
}
