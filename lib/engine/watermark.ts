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

export type WatermarkPosition = "center" | "tile" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type WatermarkOptions = {
  text?: string;
  logo?: HTMLImageElement;
  opacity?: number; // 0-1, default 0.5
  position?: WatermarkPosition; // default "bottom-right"
  fontSizePx?: number; // default: proportional to canvas width
  color?: string; // default "#ffffff"
};

/** Maps a corner/center position to a draw anchor + text alignment, with a
 * fixed px margin from the edges. */
export function anchorForPosition(
  w: number,
  h: number,
  position: Exclude<WatermarkPosition, "tile">,
  marginPx = 24
): { x: number; y: number; align: CanvasTextAlign; baseline: CanvasTextBaseline } {
  const xMap = {
    "top-left": marginPx,
    "bottom-left": marginPx,
    center: w / 2,
    "top-right": w - marginPx,
    "bottom-right": w - marginPx,
  };
  const yMap = {
    "top-left": marginPx,
    "top-right": marginPx,
    center: h / 2,
    "bottom-left": h - marginPx,
    "bottom-right": h - marginPx,
  };
  const align: CanvasTextAlign = position.includes("left") ? "left" : position.includes("right") ? "right" : "center";
  const baseline: CanvasTextBaseline = position.includes("top") ? "top" : position === "center" ? "middle" : "bottom";
  return { x: xMap[position], y: yMap[position], align, baseline };
}

/** Configurable watermark for the standalone Watermark tool — deliberately a
 * separate function from withWatermark() above, which stays a fixed,
 * obnoxious anti-piracy preview mark. This one respects the user's own
 * text/logo, opacity, and placement. */
export function applyWatermark(source: HTMLCanvasElement, opts: WatermarkOptions): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext("2d")!;
  ctx.drawImage(source, 0, 0);
  ctx.save();
  ctx.globalAlpha = opts.opacity ?? 0.5;
  ctx.fillStyle = opts.color ?? "#ffffff";
  const fontSize = opts.fontSizePx ?? Math.round(out.width / 20);
  ctx.font = `${fontSize}px sans-serif`;

  if (opts.position === "tile") {
    // Deliberately duplicates the tile loop above rather than sharing it —
    // not worth abstracting for this size, and keeps the internal
    // anti-piracy mark isolated from a config-driven caller.
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.translate(out.width / 2, out.height / 2);
    ctx.rotate(-Math.PI / 8);
    if (opts.text) {
      for (let y = -out.height; y < out.height * 2; y += out.width / 3.5) {
        ctx.fillText(opts.text, 0, y);
      }
    }
  } else {
    const { x, y, align, baseline } = anchorForPosition(out.width, out.height, opts.position ?? "bottom-right");
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    if (opts.logo) {
      const logoH = fontSize * 2;
      const logoW = logoH * (opts.logo.naturalWidth / opts.logo.naturalHeight);
      const lx = align === "right" ? x - logoW : align === "center" ? x - logoW / 2 : x;
      const ly = baseline === "bottom" ? y - logoH : y;
      ctx.drawImage(opts.logo, lx, ly, logoW, logoH);
    } else if (opts.text) {
      ctx.fillText(opts.text, x, y);
    }
  }
  ctx.restore();
  return out;
}
