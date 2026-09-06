/**
 * JPEG size targeting. `bisectQuality` is pure (takes an async size-measuring
 * function, so it's unit testable without canvas); `encodeToSpec` is the
 * canvas-dependent wrapper the pipeline actually calls.
 */
import type { Spec } from "../specs";

export async function bisectQuality(
  measureKb: (quality: number) => Promise<number>,
  maxKb: number,
  lo = 0.35,
  hi = 0.95,
  iterations = 7
): Promise<number> {
  let best = lo;
  for (let i = 0; i < iterations; i++) {
    const q = (lo + hi) / 2;
    const kb = await measureKb(q);
    if (kb <= maxKb) {
      best = q;
      lo = q;
    } else {
      hi = q;
    }
  }
  return best;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode image"))), type, quality)
  );
}

export async function encodeToSpec(canvas: HTMLCanvasElement, spec: Spec): Promise<{ blob: Blob; kb: number }> {
  const mime = spec.digital.format === "png" ? "image/png" : "image/jpeg";

  if (mime === "image/png" || !spec.digital.max_kb) {
    const blob = await canvasToBlob(canvas, mime, 0.92);
    return { blob, kb: blob.size / 1024 };
  }

  const maxKb = spec.digital.max_kb;
  const quality = await bisectQuality(
    async (q) => (await canvasToBlob(canvas, mime, q)).size / 1024,
    maxKb
  );
  const blob = await canvasToBlob(canvas, mime, quality);
  return { blob, kb: blob.size / 1024 };
}
