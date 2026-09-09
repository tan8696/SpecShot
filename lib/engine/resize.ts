/** Pure aspect-lock math: given source dimensions and which side the user
 * just typed, computes the other side to preserve the ratio. No canvas. */
export function lockedDimension(
  sourceW: number,
  sourceH: number,
  changedSide: "width" | "height",
  changedValue: number
): { width: number; height: number } {
  const ratio = sourceW / sourceH;
  return changedSide === "width"
    ? { width: changedValue, height: Math.max(1, Math.round(changedValue / ratio)) }
    : { width: Math.max(1, Math.round(changedValue * ratio)), height: changedValue };
}

/** Pure: percent -> pixel dimensions off the source's natural size. */
export function dimensionsFromPercent(sourceW: number, sourceH: number, percent: number) {
  return {
    width: Math.max(1, Math.round((sourceW * percent) / 100)),
    height: Math.max(1, Math.round((sourceH * percent) / 100)),
  };
}

/** Canvas-dependent: draws img at exactly width x height. Unlike
 * compress.ts's drawResized, this allows upscaling on purpose — a resize
 * tool has to let you go bigger, not just smaller. */
export function drawToSize(img: HTMLImageElement, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
  return canvas;
}
