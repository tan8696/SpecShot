import { describe, it, expect } from "vitest";
import { rollAngle, rotatePoint, midpoint, computeCrop, cropOverflows } from "../lib/engine/geometry";

describe("rollAngle", () => {
  it("is zero when eyes are level", () => {
    expect(rollAngle({ x: 0, y: 100 }, { x: 200, y: 100 })).toBeCloseTo(0);
  });

  it("is positive when the right-hand point sits lower (head tilted)", () => {
    expect(rollAngle({ x: 0, y: 90 }, { x: 200, y: 110 })).toBeGreaterThan(0);
  });
});

describe("rotatePoint", () => {
  it("leaves the pivot unchanged", () => {
    const pivot = { x: 50, y: 50 };
    expect(rotatePoint(pivot, pivot, 1.2)).toEqual(pivot);
  });

  it("undoes rollAngle: rotating by -rollAngle levels a tilted pair", () => {
    const left = { x: 0, y: 90 };
    const right = { x: 200, y: 110 };
    const pivot = midpoint(left, right);
    const theta = -rollAngle(left, right);
    const leveled = rotatePoint(right, pivot, theta);
    expect(leveled.y).toBeCloseTo(pivot.y, 5);
  });
});

describe("computeCrop", () => {
  const target = { outW: 413, outH: 531, dpi: 300, headTargetMm: 34, eyeTargetPct: 60 };

  it("scales the measured head to the target mm height", () => {
    const crownY = 100;
    const chinY = 300;
    const eye = { x: 400, y: 180 };
    const crop = computeCrop(crownY, chinY, eye, target);

    const scale = target.outW / crop.w;
    const ppm = target.dpi / 25.4;
    const headMmAfterScale = ((chinY - crownY) * scale) / ppm;
    expect(headMmAfterScale).toBeCloseTo(target.headTargetMm, 5);
  });

  it("places the eye line at the requested percentage from the bottom", () => {
    const crownY = 100;
    const chinY = 300;
    const eye = { x: 400, y: 180 };
    const crop = computeCrop(crownY, chinY, eye, target);

    const scale = target.outW / crop.w;
    const eyeYInOutput = (eye.y - crop.y) * scale;
    const pctFromBottom = (1 - eyeYInOutput / target.outH) * 100;
    expect(pctFromBottom).toBeCloseTo(target.eyeTargetPct, 5);
  });
});

describe("cropOverflows", () => {
  it("flags a crop that needs space above the source image", () => {
    expect(cropOverflows({ x: -5, y: -1, w: 100, h: 100 }, 500, 500)).toBe(true);
  });

  it("accepts a crop fully inside the source", () => {
    expect(cropOverflows({ x: 10, y: 10, w: 100, h: 100 }, 500, 500)).toBe(false);
  });

  it("flags a crop that runs past the right or bottom edge", () => {
    expect(cropOverflows({ x: 450, y: 10, w: 100, h: 100 }, 500, 500)).toBe(true);
    expect(cropOverflows({ x: 10, y: 450, w: 100, h: 100 }, 500, 500)).toBe(true);
  });
});
