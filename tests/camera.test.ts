import { describe, it, expect } from "vitest";
import { evaluateFraming, type NormalizedLandmark } from "../lib/engine/camera";

// Only the indices evaluateFraming actually reads matter: 10 (forehead),
// 152 (chin), 234/454 (face edges), 33/133/362/263 (eye corners).
function landmarks(overrides: Record<number, NormalizedLandmark>): NormalizedLandmark[] {
  const arr: NormalizedLandmark[] = new Array(455).fill({ x: 0.5, y: 0.5 });
  for (const [i, p] of Object.entries(overrides)) arr[Number(i)] = p;
  return arr;
}

const CENTERED_LEVEL_EYES = {
  33: { x: 0.4, y: 0.4 },
  133: { x: 0.45, y: 0.4 },
  362: { x: 0.55, y: 0.4 },
  263: { x: 0.6, y: 0.4 },
};

describe("evaluateFraming", () => {
  it("is ready when centered, correctly sized, and level", () => {
    const lm = landmarks({
      10: { x: 0.5, y: 0.3 },
      152: { x: 0.5, y: 0.7 },
      234: { x: 0.35, y: 0.5 },
      454: { x: 0.65, y: 0.5 },
      ...CENTERED_LEVEL_EYES,
    });
    const g = evaluateFraming(lm, 1, 1);
    expect(g).toEqual({ faceDetected: true, message: "Hold still…", ready: true });
  });

  it("asks to move closer when the face is too small", () => {
    const lm = landmarks({
      10: { x: 0.5, y: 0.4 },
      152: { x: 0.5, y: 0.5 }, // height ratio 0.1
      234: { x: 0.35, y: 0.5 },
      454: { x: 0.65, y: 0.5 },
      ...CENTERED_LEVEL_EYES,
    });
    expect(evaluateFraming(lm, 1, 1).message).toBe("Move closer");
  });

  it("asks to move back when the face is too large", () => {
    const lm = landmarks({
      10: { x: 0.5, y: 0.1 },
      152: { x: 0.5, y: 0.7 }, // height ratio 0.6
      234: { x: 0.35, y: 0.5 },
      454: { x: 0.65, y: 0.5 },
      ...CENTERED_LEVEL_EYES,
    });
    expect(evaluateFraming(lm, 1, 1).message).toBe("Move back");
  });

  it("accounts for the mirrored preview: face right of raw-center reads as 'Move right'", () => {
    // Raw center is well right of frame-center — on the mirrored screen the
    // user sees themself left of center, so the correct instruction (in
    // terms of the mirror they're looking at) is to move right.
    const lm = landmarks({
      10: { x: 0.8, y: 0.3 },
      152: { x: 0.8, y: 0.7 },
      234: { x: 0.65, y: 0.5 },
      454: { x: 0.95, y: 0.5 },
      ...CENTERED_LEVEL_EYES,
    });
    expect(evaluateFraming(lm, 1, 1).message).toBe("Move right");
  });

  it("accounts for the mirrored preview: face left of raw-center reads as 'Move left'", () => {
    const lm = landmarks({
      10: { x: 0.2, y: 0.3 },
      152: { x: 0.2, y: 0.7 },
      234: { x: 0.05, y: 0.5 },
      454: { x: 0.35, y: 0.5 },
      ...CENTERED_LEVEL_EYES,
    });
    expect(evaluateFraming(lm, 1, 1).message).toBe("Move left");
  });

  it("asks to move up when the face sits low in frame", () => {
    const lm = landmarks({
      10: { x: 0.5, y: 0.5 },
      152: { x: 0.5, y: 0.9 },
      234: { x: 0.35, y: 0.7 },
      454: { x: 0.65, y: 0.7 },
      33: { x: 0.4, y: 0.6 },
      133: { x: 0.45, y: 0.6 },
      362: { x: 0.55, y: 0.6 },
      263: { x: 0.6, y: 0.6 },
    });
    expect(evaluateFraming(lm, 1, 1).message).toBe("Move up");
  });

  it("flags a tilted head only once size and position are already fine", () => {
    const lm = landmarks({
      10: { x: 0.5, y: 0.3 },
      152: { x: 0.5, y: 0.7 },
      234: { x: 0.35, y: 0.5 },
      454: { x: 0.65, y: 0.5 },
      33: { x: 0.35, y: 0.35 },
      133: { x: 0.45, y: 0.4 },
      362: { x: 0.55, y: 0.4 },
      263: { x: 0.65, y: 0.45 },
    });
    const g = evaluateFraming(lm, 1, 1);
    expect(g.message).toBe("Keep your head level");
    expect(g.ready).toBe(false);
  });
});
