/**
 * Crown detection — the fix for the core technical problem in BACKEND.md's
 * sibling doc: passport specs measure from the crown (top of the skull,
 * including hair), but MediaPipe's face mesh stops at the forehead and knows
 * nothing about hair. This scans the alpha channel of a background-removed
 * cutout for the first row, inside a band centered on the face, with a long
 * enough run of opaque pixels to be hair rather than mask noise.
 *
 * Pure function over a plain {width,height,data} buffer (an ImageData
 * satisfies this structurally) so it's unit testable without a browser.
 */

export type AlphaBuffer = { width: number; height: number; data: Uint8ClampedArray };

export type CrownOptions = {
  centerX: number;
  bandWidth: number;
  /** Alpha value (0-255) counted as opaque. */
  alphaThreshold?: number;
  /** Consecutive opaque pixels required in a row to count as the crown, not noise. */
  minRun?: number;
};

export function findCrownY(buf: AlphaBuffer, opts: CrownOptions): number | null {
  const threshold = opts.alphaThreshold ?? 200;
  const minRun = opts.minRun ?? 5;
  const left = Math.max(0, Math.round(opts.centerX - opts.bandWidth / 2));
  const right = Math.min(buf.width, Math.round(opts.centerX + opts.bandWidth / 2));

  for (let y = 0; y < buf.height; y++) {
    let run = 0;
    for (let x = left; x < right; x++) {
      const alpha = buf.data[(y * buf.width + x) * 4 + 3];
      if (alpha >= threshold) {
        run++;
        if (run >= minRun) return y;
      } else {
        run = 0;
      }
    }
  }
  return null;
}
