/** HEIC/HEIF decode via heic2any (libheif compiled to WASM). The ~1.4MB
 * bundle is dynamically imported so it only loads when the HEIC tool is
 * actually used, not on every page. Returns a PNG blob — a lossless
 * intermediate the caller loads as an <img> and re-encodes to the user's
 * chosen format, so the watermark-until-ad-unlocked preview still applies,
 * same as every other tool. */
export async function decodeHeic(file: Blob): Promise<Blob> {
  const heic2any = (await import("heic2any")).default;
  const out = await heic2any({ blob: file, toType: "image/png" });
  // heic2any returns Blob | Blob[] — a single HEIC can hold a burst of
  // frames; take the first.
  return Array.isArray(out) ? out[0] : out;
}

/** Whether a file is plausibly HEIC/HEIF. Browsers and operating systems
 * are inconsistent here: the MIME type may be "image/heic", "image/heif",
 * "application/octet-stream", or empty depending on platform, so the
 * extension is the reliable tell. Pure — unit tested. */
export function looksLikeHeic(file: File): boolean {
  const mime = file.type.toLowerCase();
  if (mime === "image/heic" || mime === "image/heif") return true;
  return /\.hei[cf]$/i.test(file.name);
}
