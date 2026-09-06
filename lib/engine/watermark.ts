/** Draws a repeated diagonal watermark over a canvas for a free preview.
 * Shared by all three tools now that all three gate their real download
 * behind one ad — without this, the live preview canvas could just be
 * right-click-saved, making the ad gate pointless. */
export function withWatermark(source: HTMLCanvasElement, label = "SPECSHOT PREVIEW"): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext("2d")!;
  ctx.drawImage(source, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 2;
  ctx.font = `${Math.round(out.width / 9)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate(-Math.PI / 8);
  for (let y = -out.height; y < out.height * 2; y += out.width / 3.5) {
    ctx.strokeText(label, 0, y);
    ctx.fillText(label, 0, y);
  }
  ctx.restore();
  return out;
}
