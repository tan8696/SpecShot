/**
 * Enlarging an image well. `drawImage` straight to a 4x canvas asks the
 * browser to invent three quarters of its pixels in one bilinear pass, which
 * is exactly the case that scaler is worst at — the result is soft and a
 * little blocky. Doubling repeatedly keeps every pass inside the scaler's
 * good range, and an unsharp mask afterwards puts back the local contrast
 * that any interpolation flattens.
 *
 * None of this recovers detail that was never captured. It makes an
 * enlargement look like a good enlargement, not like a photo taken at that
 * size.
 *
 * The step ladder and the mask are pure (the mask takes a raw RGBA array), so
 * both are unit tested without a canvas; only `upscaleCanvas` touches the DOM.
 */

/** Canvas area most browsers will still allocate. Safari is the low bar here
 * (~16.7M px); past it toBlob returns null or a blank image, so the tools cap
 * the scale rather than hand back an empty file. */
export const MAX_PIXELS = 16_777_216;

/** Largest multiple of the source that still fits MAX_PIXELS, rounded down to
 * a tenth so the UI has a sane number to show. Never returns below 1. */
export function clampScale(sourceW: number, sourceH: number, scale: number): number {
  const max = Math.sqrt(MAX_PIXELS / (sourceW * sourceH));
  return Math.max(1, Math.min(scale, Math.floor(max * 10) / 10));
}

/** The intermediate sizes to draw through, ending exactly on the target.
 * Geometric, so no single step is more than a doubling on either axis — and
 * both axes are handled together, because the resizer lets you unlock the
 * aspect ratio and stretch one side further than the other. */
export function upscaleSteps(
  sourceW: number,
  sourceH: number,
  targetW: number,
  targetH: number
): { width: number; height: number }[] {
  const growth = Math.max(targetW / sourceW, targetH / sourceH);
  const n = Math.max(1, Math.ceil(Math.log2(growth)));
  const steps = [];
  for (let i = 1; i <= n; i++) {
    steps.push(
      i === n
        ? { width: targetW, height: targetH }
        : {
            width: Math.max(1, Math.round(sourceW * (targetW / sourceW) ** (i / n))),
            height: Math.max(1, Math.round(sourceH * (targetH / sourceH) ** (i / n))),
          }
    );
  }
  return steps;
}

// ponytail: naive O(pixels x radius) separable box blur. Radius is 1-3 here,
// so it costs a few passes over the array; swap in a sliding-window sum if
// bigger radii ever ship.
function boxBlur(src: Uint8ClampedArray, width: number, height: number, radius: number): Uint8ClampedArray {
  const pass = (from: Uint8ClampedArray, horizontal: boolean) => {
    const to = new Uint8ClampedArray(from.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          let n = 0;
          for (let k = -radius; k <= radius; k++) {
            const sx = horizontal ? x + k : x;
            const sy = horizontal ? y : y + k;
            if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue;
            sum += from[(sy * width + sx) * 4 + c];
            n++;
          }
          to[(y * width + x) * 4 + c] = sum / n;
        }
      }
    }
    return to;
  };
  return pass(pass(src, true), false);
}

/** Unsharp mask, in place on an RGBA array: every channel is pushed away from
 * its blurred neighbourhood by `amount`. Alpha is left alone. Writing through
 * a Uint8ClampedArray does the 0-255 clamping for us. */
export function unsharpMask(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number,
  radius = 1
): Uint8ClampedArray {
  if (amount <= 0 || radius < 1) return data;
  const blurred = boxBlur(data, width, height, radius);
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const v = data[i + c];
      data[i + c] = v + amount * (v - blurred[i + c]);
    }
  }
  return data;
}

/** Canvas-dependent: steps the image up to width x height, then sharpens.
 * `amount` 0 turns the mask off entirely. Radius follows the scale factor —
 * a 4x enlargement smears detail over wider runs of pixels than a 2x one, so
 * a 1px mask would sharpen at the wrong scale. */
export function upscaleCanvas(
  img: HTMLImageElement,
  width: number,
  height: number,
  amount = 0.6
): HTMLCanvasElement {
  let src: CanvasImageSource = img;
  let canvas: HTMLCanvasElement | null = null;

  for (const step of upscaleSteps(img.naturalWidth, img.naturalHeight, width, height)) {
    const next = document.createElement("canvas");
    next.width = step.width;
    next.height = step.height;
    const ctx = next.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, 0, 0, step.width, step.height);
    src = next;
    canvas = next;
  }

  const out = canvas!;
  if (amount > 0) {
    const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
    const radius = Math.min(3, Math.max(1, Math.round(scale / 2)));
    const ctx = out.getContext("2d")!;
    const pixels = ctx.getImageData(0, 0, out.width, out.height);
    unsharpMask(pixels.data, pixels.width, pixels.height, amount, radius);
    ctx.putImageData(pixels, 0, 0);
  }
  return out;
}
