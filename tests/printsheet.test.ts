import { describe, it, expect } from "vitest";
import { computeGridLayout, planPrintSheet } from "../lib/engine/printsheet";

// 3mm gap at 300dpi -> 35px, same conversion pipeline.ts uses (dpi / 25.4).
const GAP_PX_AT_300DPI = Math.round(3 * (300 / 25.4));

describe("computeGridLayout", () => {
  it("fits 2 US 2x2in passport photos (602x602px) on a 4x6in sheet — matches the standard drugstore print", () => {
    // 4x6in @300dpi = 1200x1800px. Two 51mm-wide (602px) photos already sum
    // to 102mm, over the 101.6mm (4in) sheet width even at zero gap, so only
    // one column fits — this is the real "2 photos per 4x6" product.
    const layout = computeGridLayout(1200, 1800, 602, 602, GAP_PX_AT_300DPI);
    expect(layout).toEqual({ cols: 1, rows: 2, count: 2 });
  });

  it("fits 6 UK passport photos (413x531px, 35x45mm) on a 4x6in sheet", () => {
    const layout = computeGridLayout(1200, 1800, 413, 531, GAP_PX_AT_300DPI);
    expect(layout).toEqual({ cols: 2, rows: 3, count: 6 });
  });

  it("returns zero copies, not a negative count, when the photo doesn't fit at all", () => {
    const layout = computeGridLayout(5, 5, 600, 600, 10);
    expect(layout).toEqual({ cols: 0, rows: 0, count: 0 });
  });
});

describe("planPrintSheet", () => {
  it("picks portrait over landscape when portrait yields more copies", () => {
    // UK passport photo (413x531px @300dpi) on A4 (2480x3508px @300dpi):
    // portrait fits 5x6=30, landscape fits 7x4=28 — portrait wins.
    const plan = planPrintSheet("a4", 413, 531, 300);
    expect(plan.sheetWidthPx).toBeLessThan(plan.sheetHeightPx);
    expect(plan.count).toBe(30);
  });
});
