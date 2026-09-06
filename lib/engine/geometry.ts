/**
 * Pure geometry — no DOM, no canvas, no WASM. Everything here is unit
 * tested directly. The DOM-dependent orchestration that calls these lives in
 * lib/engine/pipeline.ts.
 */

export type Point = { x: number; y: number };

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Angle (radians) of the line from `left` to `right`. Used to measure how
 * far the head is tilted before leveling it. */
export function rollAngle(left: Point, right: Point): number {
  return Math.atan2(right.y - left.y, right.x - left.x);
}

/**
 * Rotates `p` by `angle` about `pivot`, using the same matrix
 * CanvasRenderingContext2D.rotate() applies to pixels. Landmarks must be
 * pushed through this exact transform after rotating the image, or the
 * measurements and the pixels drift apart.
 */
export function rotatePoint(p: Point, pivot: Point, angle: number): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = p.x - pivot.x;
  const dy = p.y - pivot.y;
  return {
    x: pivot.x + dx * cos - dy * sin,
    y: pivot.y + dx * sin + dy * cos,
  };
}

export type CropTarget = {
  outW: number;
  outH: number;
  dpi: number;
  headTargetMm: number;
  eyeTargetPct: number; // from the bottom of the frame
};

export type CropRect = { x: number; y: number; w: number; h: number };

/**
 * Solves the crop rectangle, in source-image pixels, that puts the measured
 * head at headTargetMm and the eye line at eyeTargetPct once scaled to
 * outW x outH.
 */
export function computeCrop(
  crownY: number,
  chinY: number,
  eye: Point,
  target: CropTarget
): CropRect {
  const ppm = target.dpi / 25.4;
  const headPx = chinY - crownY;
  const scale = (target.headTargetMm * ppm) / headPx;
  const eyeOutY = target.outH * (1 - target.eyeTargetPct / 100);
  return {
    x: eye.x - target.outW / 2 / scale,
    y: eye.y - eyeOutY / scale,
    w: target.outW / scale,
    h: target.outH / scale,
  };
}

/** True when the crop needs pixels outside the source image — the subject
 * didn't leave enough space in the original frame. */
export function cropOverflows(crop: CropRect, sourceW: number, sourceH: number): boolean {
  return crop.x < 0 || crop.y < 0 || crop.x + crop.w > sourceW || crop.y + crop.h > sourceH;
}
