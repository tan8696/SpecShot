import { describe, it, expect } from "vitest";
import { clampCropRect, clampCropRectToRatio, applyAspectLock, centeredCropForAspect, ASPECT_RATIOS } from "../lib/engine/crop";

describe("clampCropRect", () => {
  it("leaves a rect that already fits untouched", () => {
    expect(clampCropRect({ x: 10, y: 10, w: 100, h: 100 }, 500, 500)).toEqual({ x: 10, y: 10, w: 100, h: 100 });
  });

  it("shrinks a rect larger than the bounds instead of just clamping position", () => {
    expect(clampCropRect({ x: 0, y: 0, w: 800, h: 800 }, 500, 500)).toEqual({ x: 0, y: 0, w: 500, h: 500 });
  });

  it("shifts a rect back inside bounds when it overflows past an edge", () => {
    // 100-wide rect at x=450 on a 500-wide bound overflows by 50 -> shifts to x=400
    expect(clampCropRect({ x: 450, y: 0, w: 100, h: 100 }, 500, 500)).toEqual({ x: 400, y: 0, w: 100, h: 100 });
  });

  it("never produces a negative x/y", () => {
    expect(clampCropRect({ x: -50, y: -50, w: 100, h: 100 }, 500, 500)).toEqual({ x: 0, y: 0, w: 100, h: 100 });
  });
});

describe("applyAspectLock", () => {
  it("re-derives height from width, anchored at the rect's top-left", () => {
    const locked = applyAspectLock({ x: 20, y: 30, w: 400, h: 999 }, ASPECT_RATIOS["4:3"]);
    expect(locked).toEqual({ x: 20, y: 30, w: 400, h: 300 });
  });
});

describe("clampCropRectToRatio", () => {
  // Regression: found live — applying a 1:1 preset to a 575x400 rect on an
  // 800x500 image used to come back 575x500 (plain clampCropRect clamps h to
  // the 500-tall bound but leaves w untouched), silently no longer square.
  it("scales both dimensions together when the ratio'd rect doesn't fit, instead of breaking the ratio", () => {
    const rect = clampCropRectToRatio({ x: 0, y: 0, w: 575, h: 575 }, 800, 500, 1);
    expect(rect.w).toBe(rect.h); // still square
    expect(rect.h).toBeLessThanOrEqual(500);
  });

  it("leaves an already-fitting ratio'd rect untouched", () => {
    expect(clampCropRectToRatio({ x: 10, y: 10, w: 300, h: 225 }, 800, 500, 4 / 3)).toEqual({ x: 10, y: 10, w: 300, h: 225 });
  });

  it("repositions x/y back into bounds after a dimension shrinks", () => {
    const rect = clampCropRectToRatio({ x: 700, y: 0, w: 575, h: 575 }, 800, 500, 1);
    expect(rect.x + rect.w).toBeLessThanOrEqual(800);
    expect(rect.y + rect.h).toBeLessThanOrEqual(500);
  });
});

describe("centeredCropForAspect", () => {
  it("returns the full bounds for a null (free) ratio", () => {
    expect(centeredCropForAspect(800, 600, null)).toEqual({ x: 0, y: 0, w: 800, h: 600 });
  });

  it("fits and centers a 1:1 crop inside a wider-than-tall bound", () => {
    // 800x600 bound, 1:1 ratio -> limited by height (600), centered horizontally
    const rect = centeredCropForAspect(800, 600, 1);
    expect(rect.w).toBe(600);
    expect(rect.h).toBe(600);
    expect(rect.x).toBe(100);
    expect(rect.y).toBe(0);
  });
});
