import { describe, it, expect } from "vitest";
import { wrapText } from "../lib/engine/textlayer";

// Fake measure: 10px per character.
const measure = (s: string) => s.length * 10;

describe("wrapText", () => {
  it("keeps a short line on one line", () => {
    expect(wrapText(measure, "hello world", 300)).toEqual(["hello world"]);
  });

  it("wraps on word boundaries when a line would overflow", () => {
    // maxWidth 100 -> 10 chars per line
    expect(wrapText(measure, "aaaa bbbb cccc", 100)).toEqual(["aaaa bbbb", "cccc"]);
  });

  it("preserves explicit newlines", () => {
    expect(wrapText(measure, "top line\nbottom line", 500)).toEqual(["top line", "bottom line"]);
  });

  it("hard-breaks a single word wider than maxWidth", () => {
    // "supercalifragilistic" is 20 chars = 200px; maxWidth 100 -> two 10-char chunks
    expect(wrapText(measure, "supercalifragilistic", 100)).toEqual(["supercalif", "ragilistic"]);
  });

  it("collapses runs of whitespace", () => {
    expect(wrapText(measure, "a    b", 500)).toEqual(["a b"]);
  });
});
