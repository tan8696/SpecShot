import { describe, it, expect } from "vitest";
import { buildFilterString } from "../lib/engine/editor";

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
