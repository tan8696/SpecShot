import { compressToTargetKb, type CompressResult } from "./compress";

export { loadImageFile } from "./compress";

export class NoInkFoundError extends Error {
  constructor() {
    super("Couldn't find a signature in that image — try a clearer photo with more contrast against the paper.");
  }
}

export type Bounds = { minX: number; minY: number; maxX: number; maxY: number };
export type RgbaBuffer = { width: number; height: number; data: Uint8ClampedArray };
export type Background = "white" | "transparent";

/**
 * Thresholds a scanned signature to pure ink/background in place (mutates
 * buf.data) and returns the ink's bounding box — null if nothing darker
 * than the threshold was found (blank page, or threshold set too low).
 * Pure and DOM-free so it's unit tested directly; cleanSignature below is
 * the canvas-dependent wrapper the UI actually calls.
 */
export function thresholdSignature(buf: RgbaBuffer, threshold: number, background: Background): Bounds | null {
  const { width, height, data } = buf;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (gray < threshold) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 255;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      } else if (background === "transparent") {
        data[i + 3] = 0;
      } else {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
      }
    }
  }

  return maxX >= minX && maxY >= minY ? { minX, minY, maxX, maxY } : null;
}

/** Thresholds, then crops tightly to the ink with a small margin. */
export function cleanSignature(img: HTMLImageElement, threshold: number, background: Background): HTMLCanvasElement {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, w, h);
  const bounds = thresholdSignature(imageData, threshold, background);
  if (!bounds) throw new NoInkFoundError();
  ctx.putImageData(imageData, 0, 0);

  const margin = Math.round(Math.max(w, h) * 0.03);
  const cropX = Math.max(0, bounds.minX - margin);
  const cropY = Math.max(0, bounds.minY - margin);
  const cropW = Math.min(w, bounds.maxX + margin) - cropX;
  const cropH = Math.min(h, bounds.maxY + margin) - cropY;

  const out = document.createElement("canvas");
  out.width = cropW;
  out.height = cropH;
  out.getContext("2d")!.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  return out;
}

/** Scales to fit within targetW x targetH (never stretches/distorts the
 * signature) and centers it on a canvas of exactly that size — most exam
 * portals want an exact pixel size, not just "under some limit". */
export function fitToSize(source: HTMLCanvasElement, targetW: number, targetH: number, background: Background): HTMLCanvasElement {
  const scale = Math.min(targetW / source.width, targetH / source.height);
  const drawW = Math.round(source.width * scale);
  const drawH = Math.round(source.height * scale);
  const out = document.createElement("canvas");
  out.width = targetW;
  out.height = targetH;
  const ctx = out.getContext("2d")!;
  if (background === "white") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, targetW, targetH);
  }
  const dx = Math.round((targetW - drawW) / 2);
  const dy = Math.round((targetH - drawH) / 2);
  ctx.drawImage(source, 0, 0, source.width, source.height, dx, dy, drawW, drawH);
  return out;
}

/** JPEG can't hold transparency, so a transparent background forces PNG;
 * white backgrounds use JPEG for tighter size targeting. */
export function encodeSignature(canvas: HTMLCanvasElement, background: Background, targetKb: number): Promise<CompressResult> {
  return compressToTargetKb(canvas, background === "transparent" ? "png" : "jpeg", targetKb);
}
