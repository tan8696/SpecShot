import { bisectQuality, canvasToBlob } from "./encode";

/**
 * Generic photo compression — no document spec, no face detection. Resize
 * (optional) then re-encode, either at a chosen quality or bisected to hit a
 * target file size (reusing the same binary search the ID-photo pipeline
 * uses for exam size caps).
 */

export type CompressFormat = "jpeg" | "png" | "webp";

export function formatFromMime(mime: string): CompressFormat {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpeg";
}

export function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image file."));
    img.src = URL.createObjectURL(file);
  });
}

/** Draws the image at its natural size, or scaled down to fit maxDim on its
 * longest side. Never scales up. */
export function drawResized(img: HTMLImageElement, maxDim?: number): HTMLCanvasElement {
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  if (maxDim && Math.max(w, h) > maxDim) {
    const scale = maxDim / Math.max(w, h);
    w = Math.max(1, Math.round(w * scale));
    h = Math.max(1, Math.round(h * scale));
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return canvas;
}

export type CompressResult = { blob: Blob; width: number; height: number };

export async function compressToQuality(
  canvas: HTMLCanvasElement,
  format: CompressFormat,
  qualityPct: number
): Promise<CompressResult> {
  const mime = `image/${format}`;
  const blob = await canvasToBlob(canvas, mime, format === "png" ? undefined : qualityPct / 100);
  return { blob, width: canvas.width, height: canvas.height };
}

/** PNG has no quality knob, so a size target only makes sense for jpeg/webp;
 * callers should steer users toward those formats when targeting a size. */
export async function compressToTargetKb(
  canvas: HTMLCanvasElement,
  format: CompressFormat,
  targetKb: number
): Promise<CompressResult> {
  const mime = `image/${format}`;
  if (format === "png") {
    const blob = await canvasToBlob(canvas, mime);
    return { blob, width: canvas.width, height: canvas.height };
  }
  const quality = await bisectQuality(async (q) => (await canvasToBlob(canvas, mime, q)).size / 1024, targetKb, 0.05, 0.98);
  const blob = await canvasToBlob(canvas, mime, quality);
  return { blob, width: canvas.width, height: canvas.height };
}
