import { describe, it, expect } from "vitest";
import { lockedDimension, dimensionsFromPercent } from "../lib/engine/resize";

describe("lockedDimension", () => {
  it("derives height from a new width, preserving the source ratio", () => {
    // 1000x500 source (2:1) resized to width 400 -> height 200
    expect(lockedDimension(1000, 500, "width", 400)).toEqual({ width: 400, height: 200 });
  });

  it("derives width from a new height, preserving the source ratio", () => {
    expect(lockedDimension(1000, 500, "height", 200)).toEqual({ width: 400, height: 200 });
  });

  it("never derives a dimension below 1px", () => {
    expect(lockedDimension(1000, 500, "width", 1).height).toBeGreaterThanOrEqual(1);
  });
});

describe("dimensionsFromPercent", () => {
  it("scales both dimensions by the given percent", () => {
    expect(dimensionsFromPercent(1000, 500, 50)).toEqual({ width: 500, height: 250 });
  });

  it("allows upscaling past 100%", () => {
    expect(dimensionsFromPercent(1000, 500, 150)).toEqual({ width: 1500, height: 750 });
  });
});
