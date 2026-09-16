import { describe, it, expect } from "vitest";
import { upscaleSteps, unsharpMask, clampScale, MAX_PIXELS } from "../lib/engine/upscale";

describe("upscaleSteps", () => {
  it("never grows either axis by more than a doubling in one step", () => {
    const steps = upscaleSteps(100, 80, 800, 640); // 8x
    let w = 100;
    let h = 80;
    for (const s of steps) {
      expect(s.width / w).toBeLessThanOrEqual(2.0001);
      expect(s.height / h).toBeLessThanOrEqual(2.0001);
      w = s.width;
      h = s.height;
    }
  });

  it("lands exactly on the requested size", () => {
    expect(upscaleSteps(100, 80, 833, 617).at(-1)).toEqual({ width: 833, height: 617 });
  });

  it("uses a single step when the image is not being enlarged", () => {
    expect(upscaleSteps(1000, 500, 400, 200)).toEqual([{ width: 400, height: 200 }]);
    expect(upscaleSteps(1000, 500, 1500, 750)).toHaveLength(1); // 1.5x fits in one pass
  });

  it("counts steps off whichever axis grows most when the ratio is unlocked", () => {
    const steps = upscaleSteps(100, 100, 150, 800); // 1.5x wide, 8x tall
    expect(steps).toHaveLength(3);
    expect(steps.at(-1)).toEqual({ width: 150, height: 800 });
  });
});

describe("clampScale", () => {
  it("leaves a scale that fits alone", () => {
    expect(clampScale(800, 600, 4)).toBe(4);
  });

  it("caps a scale that would blow past the canvas pixel ceiling", () => {
    const capped = clampScale(4000, 3000, 8);
    expect(capped).toBeLessThan(8);
    expect(4000 * capped * (3000 * capped)).toBeLessThanOrEqual(MAX_PIXELS);
  });

  it("never returns below 1x, even for an already-huge source", () => {
    expect(clampScale(9000, 9000, 2)).toBe(1);
  });
});

describe("unsharpMask", () => {
  /** A 4x1 strip: two dark pixels then two light ones, blurred across the
   * seam — the shape interpolation always leaves behind. */
  const strip = () => new Uint8ClampedArray([
    40, 40, 40, 255,
    90, 90, 90, 255,
    150, 150, 150, 255,
    200, 200, 200, 255,
  ]);

  it("increases contrast across an edge", () => {
    const before = strip();
    const after = unsharpMask(strip(), 4, 1, 0.8);
    const gap = (d: Uint8ClampedArray) => d[8] - d[4]; // pixel 2 minus pixel 1
    expect(gap(after)).toBeGreaterThan(gap(before));
  });

  it("leaves alpha untouched and stays inside 0-255", () => {
    const after = unsharpMask(strip(), 4, 1, 3);
    for (let i = 0; i < after.length; i++) {
      expect(after[i]).toBeGreaterThanOrEqual(0);
      expect(after[i]).toBeLessThanOrEqual(255);
    }
    expect([after[3], after[7], after[11], after[15]]).toEqual([255, 255, 255, 255]);
  });

  it("is a no-op at amount 0", () => {
    expect(unsharpMask(strip(), 4, 1, 0)).toEqual(strip());
  });

  it("leaves a flat area flat", () => {
    const flat = new Uint8ClampedArray(4 * 4).fill(120);
    for (let i = 3; i < flat.length; i += 4) flat[i] = 255;
    expect(Array.from(unsharpMask(flat.slice(), 2, 2, 1))).toEqual(Array.from(flat));
  });
});
