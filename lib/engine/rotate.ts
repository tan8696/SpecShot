/** 90°-increment rotation, mirror flip, and small-angle straighten (added for
 * the Crop studio). Straighten grows the canvas to the rotated bounding box
 * with transparent corners — no background-fill choice to make, the crop
 * rectangle on top is kept clear of the corners. */

export type Rotation = 90 | 180 | 270;

export function rotateCanvas(source: HTMLCanvasElement, degrees: Rotation): HTMLCanvasElement {
  const swap = degrees !== 180;
  const canvas = document.createElement("canvas");
  canvas.width = swap ? source.height : source.width;
  canvas.height = swap ? source.width : source.height;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(source, -source.width / 2, -source.height / 2);
  return canvas;
}

export function flipCanvas(source: HTMLCanvasElement, axis: "horizontal" | "vertical"): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(axis === "horizontal" ? canvas.width : 0, axis === "vertical" ? canvas.height : 0);
  ctx.scale(axis === "horizontal" ? -1 : 1, axis === "vertical" ? -1 : 1);
  ctx.drawImage(source, 0, 0);
  return canvas;
}

/** Pure: the bounding-box size after rotating a w×h rectangle by `deg`. */
export function straightenedBounds(w: number, h: number, deg: number): { width: number; height: number } {
  const r = Math.abs((deg * Math.PI) / 180);
  return {
    width: Math.ceil(Math.abs(w * Math.cos(r)) + Math.abs(h * Math.sin(r))),
    height: Math.ceil(Math.abs(w * Math.sin(r)) + Math.abs(h * Math.cos(r))),
  };
}

/** Arbitrary small-angle rotation for "straighten a tilted photo". Rotates
 * onto a canvas grown to the rotated bounding box; the exposed corners are
 * transparent. Returns `source` unchanged for a zero angle. */
export function straightenCanvas(source: HTMLCanvasElement, degrees: number): HTMLCanvasElement {
  if (!degrees) return source;
  const { width, height } = straightenedBounds(source.width, source.height, degrees);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(width / 2, height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(source, -source.width / 2, -source.height / 2);
  return canvas;
}
