/** Pure crop-rectangle math for the interactive Crop tool — the one genuinely
 * new interaction in this app (every other crop in the codebase is
 * algorithmic, computed from face landmarks, never user-dragged). Reuses
 * geometry.ts's CropRect shape rather than redefining it. */
import type { CropRect } from "./geometry";

export type AspectPreset = "free" | "1:1" | "4:3" | "3:2" | "16:9";

export const ASPECT_RATIOS: Record<Exclude<AspectPreset, "free">, number> = {
  "1:1": 1,
  "4:3": 4 / 3,
  "3:2": 3 / 2,
  "16:9": 16 / 9,
};

/** Keeps a rect fully inside [0,0,boundW,boundH] — shrinks before it shifts,
 * so a rect near an edge never silently teleports. */
export function clampCropRect(rect: CropRect, boundW: number, boundH: number): CropRect {
  const w = Math.min(rect.w, boundW);
  const h = Math.min(rect.h, boundH);
  const x = Math.min(Math.max(rect.x, 0), boundW - w);
  const y = Math.min(Math.max(rect.y, 0), boundH - h);
  return { x, y, w, h };
}

/** Re-derives height from width (anchored at the rect's top-left) to match a
 * locked ratio — called whenever a preset is picked or a locked numeric
 * field changes. */
export function applyAspectLock(rect: CropRect, ratio: number): CropRect {
  return { ...rect, h: Math.max(1, Math.round(rect.w / ratio)) };
}

/** Like clampCropRect, but for a rect whose ratio must survive being fit
 * inside bounds — clampCropRect alone shrinks an overflowing width/height
 * independently, which silently breaks a locked ratio the caller just
 * enforced (e.g. a 1:1 rect wider than the image is tall would come back
 * height-clamped but not width-clamped, no longer square). Every caller
 * that just applied a ratio (a preset, or a locked corner-drag) must use
 * this instead of the plain clamp. */
export function clampCropRectToRatio(rect: CropRect, boundW: number, boundH: number, ratio: number): CropRect {
  let { w, h } = rect;
  if (h > boundH) {
    h = boundH;
    w = h * ratio;
  }
  if (w > boundW) {
    w = boundW;
    h = w / ratio;
  }
  const x = Math.min(Math.max(rect.x, 0), boundW - w);
  const y = Math.min(Math.max(rect.y, 0), boundH - h);
  return { x, y, w, h };
}

/** Centered default rect for a ratio (or the full image for "free"), sized
 * to the largest rect of that ratio that fits inside boundW x boundH. */
export function centeredCropForAspect(boundW: number, boundH: number, ratio: number | null): CropRect {
  if (!ratio) return { x: 0, y: 0, w: boundW, h: boundH };
  const w = Math.min(boundW, boundH * ratio);
  const h = w / ratio;
  return { x: (boundW - w) / 2, y: (boundH - h) / 2, w, h };
}

/** Canvas-dependent: crops img to rect (source-image pixel coordinates). */
export function cropToCanvas(img: HTMLImageElement, rect: CropRect): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(rect.w));
  canvas.height = Math.max(1, Math.round(rect.h));
  canvas.getContext("2d")!.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, canvas.width, canvas.height);
  return canvas;
}
