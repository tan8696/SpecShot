import { describe, it, expect } from "vitest";
// @ts-expect-error — build-time validator helper, plain JS with no types
import { crownFit } from "../scripts/crown-fit.mjs";

describe("crownFit", () => {
  it("accepts a spec whose eye_line band is a wide placeholder", () => {
    // India: 36-38mm head in a 45mm frame, eye line an unsourced 40-85%
    // placeholder. The band's midpoint (62.5%) does not fit, but its lowest
    // allowed position does — so a conforming photo exists and this must
    // not warn. Guarding the exact regression that made this check honest.
    expect(crownFit(45, 36, 40).fits).toBe(true);
    expect(crownFit(45, 36, 62.5).fits).toBe(false);
  });

  it("still rejects a band where no eye position leaves room for the crown", () => {
    // A narrow, high band — the shape a real transcription error takes.
    const fit = crownFit(45, 34, 80);
    expect(fit.fits).toBe(false);
    expect(fit.needed).toBeCloseTo(16.32, 2);
    expect(fit.available).toBeCloseTo(9, 2);
  });

  it("treats exactly-enough room as fitting", () => {
    // 20mm head needs 9.6mm above the eyes; a 45mm frame with eyes at
    // 78.667% leaves exactly that.
    expect(crownFit(45, 20, (1 - 9.6 / 45) * 100).fits).toBe(true);
  });
});
