/** Shared text-on-image drawing for the Meme generator and Photo editor.
 * wrapText is pure (takes a measuring callback, like encode.ts's
 * bisectQuality) and unit tested; drawTextBlock is the canvas wrapper. */

/** Greedy word-wrap. `measure` returns the rendered width of a string in the
 * caller's current font. Words wider than maxWidth on their own are broken
 * character-by-character rather than overflowing. Respects existing
 * newlines in `text`. */
export function wrapText(measure: (s: string) => number, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const chunks = measure(word) > maxWidth ? hardBreak(measure, word, maxWidth) : [word];
      for (const chunk of chunks) {
        const test = line ? `${line} ${chunk}` : chunk;
        if (!line || measure(test) <= maxWidth) line = test;
        else {
          out.push(line);
          line = chunk;
        }
      }
    }
    out.push(line);
  }
  return out;
}

function hardBreak(measure: (s: string) => number, word: string, maxWidth: number): string[] {
  const parts: string[] = [];
  let cur = "";
  for (const ch of word) {
    if (cur && measure(cur + ch) > maxWidth) {
      parts.push(cur);
      cur = ch;
    } else {
      cur += ch;
    }
  }
  if (cur) parts.push(cur);
  return parts;
}

export type TextBlockOptions = {
  font: string; // full CSS font shorthand, e.g. 'bold 48px Impact, sans-serif'
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  align?: CanvasTextAlign; // default "center"
  anchor: "top" | "center" | "bottom";
  lineHeight: number; // px between baselines
  paddingPx?: number; // gap from the top/bottom edge for those anchors
};

/** Draws pre-wrapped lines, stroke-behind-fill so an outline reads cleanly.
 * x is where the lines are aligned to (usually canvas width / 2 for
 * centre). Returns nothing — draws straight onto ctx. */
export function drawTextBlock(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  canvasHeight: number,
  opts: TextBlockOptions
): void {
  ctx.save();
  ctx.font = opts.font;
  ctx.textAlign = opts.align ?? "center";
  ctx.textBaseline = "top";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;

  const pad = opts.paddingPx ?? 0;
  const blockHeight = lines.length * opts.lineHeight;
  const startY =
    opts.anchor === "top"
      ? pad
      : opts.anchor === "bottom"
        ? canvasHeight - blockHeight - pad
        : (canvasHeight - blockHeight) / 2;

  lines.forEach((line, i) => {
    const y = startY + i * opts.lineHeight;
    if (opts.stroke && opts.strokeWidth) {
      ctx.strokeStyle = opts.stroke;
      ctx.lineWidth = opts.strokeWidth;
      ctx.strokeText(line, x, y);
    }
    ctx.fillStyle = opts.fill;
    ctx.fillText(line, x, y);
  });
  ctx.restore();
}
