import type { MetadataRoute } from "next";

// Required for `output: "export"` — Next treats file-convention metadata
// routes as dynamic-capable by default; this opts them into static export.
export const dynamic = "force-static";

// No production domain is registered yet — set NEXT_PUBLIC_SITE_URL on the
// host before launch. Falls back to a placeholder so this never emits an
// invalid URL in local/preview builds.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://specshot.example";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
