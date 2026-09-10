import { describe, it, expect } from "vitest";
import { looksLikeHeic } from "../lib/engine/heic";

const fileWith = (name: string, type: string) => new File([new Uint8Array(1)], name, { type });

describe("looksLikeHeic", () => {
  it("accepts an image/heic MIME type", () => {
    expect(looksLikeHeic(fileWith("photo.heic", "image/heic"))).toBe(true);
  });

  it("accepts an image/heif MIME type", () => {
    expect(looksLikeHeic(fileWith("photo.heif", "image/heif"))).toBe(true);
  });

  it("falls back to the extension when the MIME type is missing or generic", () => {
    expect(looksLikeHeic(fileWith("IMG_1234.HEIC", ""))).toBe(true);
    expect(looksLikeHeic(fileWith("IMG_1234.heic", "application/octet-stream"))).toBe(true);
  });

  it("rejects a normal JPEG", () => {
    expect(looksLikeHeic(fileWith("photo.jpg", "image/jpeg"))).toBe(false);
  });

  it("rejects a PNG whose name merely contains 'heic'", () => {
    expect(looksLikeHeic(fileWith("my-heic-collection.png", "image/png"))).toBe(false);
  });
});
