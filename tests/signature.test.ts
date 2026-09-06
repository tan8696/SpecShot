import { describe, it, expect } from "vitest";
import { thresholdSignature, type RgbaBuffer } from "../lib/engine/signature";

function whitePage(width: number, height: number): RgbaBuffer {
  const data = new Uint8ClampedArray(width * height * 4).fill(255); // white, opaque
  return { width, height, data };
}

function setPixel(buf: RgbaBuffer, x: number, y: number, gray: number) {
  const i = (y * buf.width + x) * 4;
  buf.data[i] = gray;
  buf.data[i + 1] = gray;
  buf.data[i + 2] = gray;
  buf.data[i + 3] = 255;
}

describe("thresholdSignature", () => {
  it("finds the bounding box of a dark mark on a light page", () => {
    const buf = whitePage(10, 10);
    for (let y = 3; y <= 5; y++) for (let x = 2; x <= 6; x++) setPixel(buf, x, y, 20);

    const bounds = thresholdSignature(buf, 150, "white");
    expect(bounds).toEqual({ minX: 2, minY: 3, maxX: 6, maxY: 5 });
  });

  it("returns null for a blank page — nothing darker than the threshold", () => {
    const buf = whitePage(10, 10);
    expect(thresholdSignature(buf, 150, "white")).toBeNull();
  });

  it("snaps ink to pure black and background to pure white", () => {
    const buf = whitePage(4, 4);
    setPixel(buf, 1, 1, 40); // dark ink, but not pure black
    setPixel(buf, 2, 2, 230); // light, but not pure white (paper shadow)

    thresholdSignature(buf, 150, "white");

    const inkIdx = (1 * 4 + 1) * 4;
    const bgIdx = (2 * 4 + 2) * 4;
    expect([...buf.data.slice(inkIdx, inkIdx + 4)]).toEqual([0, 0, 0, 255]);
    expect([...buf.data.slice(bgIdx, bgIdx + 4)]).toEqual([255, 255, 255, 255]);
  });

  it("makes the background transparent instead of white when asked", () => {
    const buf = whitePage(2, 2);
    setPixel(buf, 0, 0, 20); // ink

    thresholdSignature(buf, 150, "transparent");

    const inkAlpha = buf.data[3];
    const bgAlpha = buf.data[(0 * 2 + 1) * 4 + 3];
    expect(inkAlpha).toBe(255);
    expect(bgAlpha).toBe(0);
  });
});
