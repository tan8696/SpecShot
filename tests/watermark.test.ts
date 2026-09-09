import { describe, it, expect } from "vitest";
import { anchorForPosition } from "../lib/engine/watermark";

describe("anchorForPosition", () => {
  it("anchors bottom-right with right/bottom alignment", () => {
    expect(anchorForPosition(1000, 500, "bottom-right", 20)).toEqual({
      x: 980,
      y: 480,
      align: "right",
      baseline: "bottom",
    });
  });

  it("anchors top-left with left/top alignment", () => {
    expect(anchorForPosition(1000, 500, "top-left", 20)).toEqual({
      x: 20,
      y: 20,
      align: "left",
      baseline: "top",
    });
  });

  it("centers with middle alignment on both axes", () => {
    expect(anchorForPosition(1000, 500, "center", 20)).toEqual({
      x: 500,
      y: 250,
      align: "center",
      baseline: "middle",
    });
  });
});
