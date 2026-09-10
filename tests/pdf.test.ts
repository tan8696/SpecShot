import { describe, it, expect } from "vitest";
import { fitContain, renderScaleForPage } from "../lib/engine/pdf";

describe("fitContain", () => {
  it("centres a landscape image inside a portrait page, scaled to fit the width minus margin", () => {
    // 1000x500 into a 595x842 A4 page, 36pt margin: avail width 523,
    // scale 0.523 -> 523x261.5, centred.
    const r = fitContain(1000, 500, 595, 842, 36);
    expect(r.w).toBeCloseTo(523, 0);
    expect(r.h).toBeCloseTo(261.5, 0);
    expect(r.x).toBeCloseTo(36, 0);
    expect(r.y).toBeCloseTo((842 - 261.5) / 2, 0);
  });

  it("never upscales past 1x", () => {
    const r = fitContain(100, 100, 595, 842, 0);
    expect(r.w).toBe(100);
    expect(r.h).toBe(100);
  });
});

describe("renderScaleForPage", () => {
  it("scales so the long side lands near the target pixel width", () => {
    // A4 portrait is 842pt long; target 1600px -> scale ~1.9
    expect(renderScaleForPage(595, 842, 1600)).toBeCloseTo(1600 / 842, 2);
  });

  it("clamps tiny pages so they aren't blown up beyond 6x", () => {
    expect(renderScaleForPage(50, 50, 1600)).toBe(6);
  });

  it("clamps huge pages so scale never drops below 0.5", () => {
    expect(renderScaleForPage(20000, 20000, 1600)).toBe(0.5);
  });
});
