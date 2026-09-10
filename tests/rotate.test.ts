import { describe, expect, it } from "vitest";
import { straightenedBounds } from "../lib/engine/rotate";

describe("straightenedBounds", () => {
  it("leaves the box unchanged at 0°", () => {
    expect(straightenedBounds(100, 60, 0)).toEqual({ width: 100, height: 60 });
  });

  it("grows a square to w·(cos+sin) at 45°", () => {
    // 100 * (cos45 + sin45) ≈ 141.42 → ceil → 142
    expect(straightenedBounds(100, 100, 45)).toEqual({ width: 142, height: 142 });
  });

  it("is unaffected by the sign of the angle", () => {
    expect(straightenedBounds(80, 40, 12)).toEqual(straightenedBounds(80, 40, -12));
  });
});
