import { describe, it, expect } from "vitest";
import { autoAdjust, buildFilterString } from "../lib/engine/editor";

/** RGBA pixels whose grey levels step evenly from lo to hi (0–255). */
function ramp(lo: number, hi: number, tint = 0, n = 200): Uint8ClampedArray {
  const px = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) {
    const v = lo + ((hi - lo) * i) / (n - 1);
    px.set([v + tint, v, v - tint, 255], i * 4);
  }
  return px;
}

describe("autoAdjust", () => {
  it("leaves a well-exposed photo (almost) alone", () => {
    for (const v of Object.values(autoAdjust(ramp(0, 255)))) expect(Math.abs(v - 100)).toBeLessThanOrEqual(3);
  });

  it("brightens an underexposed photo", () => {
    const a = autoAdjust(ramp(0, 120));
    expect(a.brightness).toBeGreaterThan(130);
    expect(a.contrast).toBeLessThanOrEqual(105);
  });

  it("adds contrast to a washed-out photo", () => {
    expect(autoAdjust(ramp(80, 200)).contrast).toBeGreaterThan(120);
  });

  it("lifts dull colour, but never saturates a greyscale image", () => {
    expect(autoAdjust(ramp(0, 255, 8)).saturation).toBeGreaterThan(100);
    expect(autoAdjust(ramp(0, 255)).saturation).toBe(100);
  });

  it("keeps every value inside the sliders' 50–150 range", () => {
    for (const a of [autoAdjust(ramp(0, 30)), autoAdjust(ramp(220, 255)), autoAdjust(ramp(100, 140, 3))]) {
      for (const v of Object.values(a)) expect(v).toBeGreaterThanOrEqual(50), expect(v).toBeLessThanOrEqual(150);
    }
  });

  it("does nothing to a flat image or a fully transparent one", () => {
    const neutral = { brightness: 100, contrast: 100, saturation: 100 };
    expect(autoAdjust(ramp(250, 255))).toEqual(neutral);
    expect(autoAdjust(new Uint8ClampedArray(16))).toEqual(neutral);
  });
});

describe("buildFilterString", () => {
  it("returns 'none' when nothing is adjusted", () => {
    expect(buildFilterString(100, 100, 100, "none")).toBe("none");
  });

  it("emits only the non-neutral adjustments", () => {
    expect(buildFilterString(120, 100, 80, "none")).toBe("brightness(1.2) saturate(0.8)");
  });

  it("appends the preset filter after the sliders", () => {
    expect(buildFilterString(110, 100, 100, "grayscale")).toBe("brightness(1.1) grayscale(1)");
  });

  it("uses only the preset when sliders are neutral", () => {
    expect(buildFilterString(100, 100, 100, "sepia")).toBe("sepia(0.65)");
  });
});
