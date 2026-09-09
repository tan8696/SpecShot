/** 90°-increment rotation and mirror flip — no arbitrary-angle rotation.
 * That needs canvas-bounding-box growth and a background-fill choice, a
 * materially bigger feature for a "straighten a tilted photo" use case
 * this tool doesn't claim to solve. Add it here later if needed. */

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
