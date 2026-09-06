import type { MetadataRoute } from "next";

// Required for `output: "export"` — Next treats file-convention metadata
// routes as dynamic-capable by default; this opts them into static export.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SpecShot",
    short_name: "SpecShot",
    description: "ID photos that meet the exact spec, measured and cropped entirely in your browser.",
    start_url: "/",
    display: "standalone",
    background_color: "#05070f",
    theme_color: "#6366f1",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
