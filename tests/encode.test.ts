import { describe, it, expect } from "vitest";
import { bisectQuality } from "../lib/engine/encode";

describe("bisectQuality", () => {
  it("converges toward the highest quality that fits under the size cap", async () => {
    // Stand-in for a real encoder: size grows monotonically with quality.
    const sizeAt = (q: number) => q * 100;
    const q = await bisectQuality(async (q) => sizeAt(q), 60);
    expect(sizeAt(q)).toBeLessThanOrEqual(60);
    expect(sizeAt(q)).toBeGreaterThan(55);
  });

  it("falls back to the lowest quality tried when the target is unreachable", async () => {
    // Even the floor quality (0.35 -> 35kb) blows past a 1kb cap, so the
    // search never finds a satisfying point and should return that floor,
    // not something arbitrarily worse.
    const sizeAt = (q: number) => q * 100;
    const q = await bisectQuality(async (q) => sizeAt(q), 1);
    expect(q).toBeCloseTo(0.35, 5);
  });
});
