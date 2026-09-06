import { describe, it, expect } from "vitest";
import { findCrownY, type AlphaBuffer } from "../lib/engine/crown";

function makeBuffer(width: number, height: number, opaqueFrom: (y: number) => [number, number]): AlphaBuffer {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const [left, right] = opaqueFrom(y);
    for (let x = left; x < right; x++) {
      data[(y * width + x) * 4 + 3] = 255;
    }
  }
  return { width, height, data };
}

describe("findCrownY", () => {
  it("finds the first row with a wide enough opaque run", () => {
    const buf = makeBuffer(20, 20, (y) => (y >= 4 ? [5, 15] : [0, 0]));
    expect(findCrownY(buf, { centerX: 10, bandWidth: 12 })).toBe(4);
  });

  it("ignores a single-pixel noise speck above the real hairline", () => {
    const data = new Uint8ClampedArray(20 * 20 * 4);
    // One stray opaque pixel at row 1 (mask noise).
    data[(1 * 20 + 10) * 4 + 3] = 255;
    // Real hairline starts at row 5, a wide run.
    for (let y = 5; y < 20; y++) {
      for (let x = 5; x < 15; x++) data[(y * 20 + x) * 4 + 3] = 255;
    }
    const buf: AlphaBuffer = { width: 20, height: 20, data };
    expect(findCrownY(buf, { centerX: 10, bandWidth: 12, minRun: 5 })).toBe(5);
  });

  it("returns null when nothing in the band is opaque", () => {
    const buf = makeBuffer(20, 20, () => [0, 0]);
    expect(findCrownY(buf, { centerX: 10, bandWidth: 12 })).toBeNull();
  });

  it("only looks inside the given band, not the whole row", () => {
    // Opaque pixels exist, but outside the search band.
    const buf = makeBuffer(20, 20, () => [0, 3]);
    expect(findCrownY(buf, { centerX: 15, bandWidth: 6 })).toBeNull();
  });
});
