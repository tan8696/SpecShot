import type { MetadataRoute } from "next";
import { loadSpecs } from "@/lib/specs";

// Required for `output: "export"` — Next treats file-convention metadata
// routes as dynamic-capable by default; this opts them into static export.
export const dynamic = "force-static";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://specshot.example";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["/", "/business/", "/photo/", "/privacy/", "/terms/"].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
  }));

  // loadSpecs() already excludes unverified specs in a production build
  // (lib/specs.ts), the same gate generateStaticParams uses — so this can
  // never list a slug that doesn't actually have a page.
  const specRoutes = loadSpecs().map((s) => ({
    url: `${SITE_URL}/photo/${s.slug}/`,
    lastModified: s.verified_on ? new Date(s.verified_on) : new Date(),
  }));

  return [...staticRoutes, ...specRoutes];
}
