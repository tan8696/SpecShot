/**
 * Tiles N copies of a finished ID photo canvas onto a printable sheet, with
 * small gaps and thin cut-guide lines between copies — the print-sheet
 * value-add photo labs sell separately. Pure grid math (computeGridLayout,
 * planPrintSheet) is unit-testable without a canvas; renderPrintSheet is the
 * canvas-dependent wrapper, mirroring the split in lib/engine/encode.ts.
 */
import { canvasToBlob } from "./encode";

export type SheetSize = "4x6" | "a4";

// Real physical sheet sizes in mm. 4x6in photo paper is the standard US
// drugstore print size; A4 is the standard everywhere else. Converted to
// pixels using the same dpi the ID photo itself was rendered at, via the
// same dpi/25.4 px-per-mm conversion used in lib/engine/pipeline.ts — no
// resampling of the photo, it's drawn onto the sheet 1:1.
const SHEET_MM: Record<SheetSize, { width_mm: number; height_mm: number }> = {
  "4x6": { width_mm: 101.6, height_mm: 152.4 },
  a4: { width_mm: 210, height_mm: 297 },
};

// Gap between copies AND the outer sheet margin (one knob) — enough room to
// cut with scissors without slicing into a photo.
const GAP_MM = 3;

/** Pure grid math: how many photoW x photoH tiles fit on a sheetW x sheetH
 * sheet, with a gapPx gap between tiles and as the outer margin. No canvas —
 * unit-testable in isolation. */
export function computeGridLayout(
  sheetWidthPx: number,
  sheetHeightPx: number,
  photoWidthPx: number,
  photoHeightPx: number,
  gapPx: number
): { cols: number; rows: number; count: number } {
  const cols = Math.max(0, Math.floor((sheetWidthPx - gapPx) / (photoWidthPx + gapPx)));
  const rows = Math.max(0, Math.floor((sheetHeightPx - gapPx) / (photoHeightPx + gapPx)));
  return { cols, rows, count: cols * rows };
}

export type SheetPlan = {
  sheetWidthPx: number;
  sheetHeightPx: number;
  gapPx: number;
  cols: number;
  rows: number;
  count: number;
};

/** Picks whichever sheet orientation fits more copies — real print services
 * orient the sheet, not the photo, to maximize yield. Pure/sync so the UI
 * can show "N copies" before rendering anything. */
export function planPrintSheet(
  sheet: SheetSize,
  photoWidthPx: number,
  photoHeightPx: number,
  dpi: number
): SheetPlan {
  const ppm = dpi / 25.4;
  const gapPx = Math.round(GAP_MM * ppm);
  const { width_mm, height_mm } = SHEET_MM[sheet];
  const wPx = Math.round(width_mm * ppm);
  const hPx = Math.round(height_mm * ppm);

  const portrait = computeGridLayout(wPx, hPx, photoWidthPx, photoHeightPx, gapPx);
  const landscape = computeGridLayout(hPx, wPx, photoWidthPx, photoHeightPx, gapPx);

  return landscape.count > portrait.count
    ? { sheetWidthPx: hPx, sheetHeightPx: wPx, gapPx, ...landscape }
    : { sheetWidthPx: wPx, sheetHeightPx: hPx, gapPx, ...portrait };
}

/** Draws the sheet: white background, the photo tiled cols x rows times with
 * gapPx between copies, and a thin dashed cut-guide rectangle around each
 * copy. Encodes with the same canvasToBlob helper encode.ts exports. */
export async function renderPrintSheet(photo: HTMLCanvasElement, sheet: SheetSize, dpi: number): Promise<Blob> {
  const plan = planPrintSheet(sheet, photo.width, photo.height, dpi);

  const canvas = document.createElement("canvas");
  canvas.width = plan.sheetWidthPx;
  canvas.height = plan.sheetHeightPx;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const gridW = plan.cols * photo.width + (plan.cols + 1) * plan.gapPx;
  const gridH = plan.rows * photo.height + (plan.rows + 1) * plan.gapPx;
  const offsetX = (canvas.width - gridW) / 2 + plan.gapPx;
  const offsetY = (canvas.height - gridH) / 2 + plan.gapPx;

  ctx.strokeStyle = "#94a3b8"; // slate-400, visible on white paper
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);

  for (let r = 0; r < plan.rows; r++) {
    for (let c = 0; c < plan.cols; c++) {
      const x = offsetX + c * (photo.width + plan.gapPx);
      const y = offsetY + r * (photo.height + plan.gapPx);
      ctx.drawImage(photo, x, y);
      ctx.strokeRect(x - plan.gapPx / 2, y - plan.gapPx / 2, photo.width + plan.gapPx, photo.height + plan.gapPx);
    }
  }

  return canvasToBlob(canvas, "image/jpeg", 0.92);
}
