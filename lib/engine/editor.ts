/** Filter composition for the Photo editor. buildFilterString is pure and
 * unit tested; the actual pixels are done by the browser via
 * `ctx.filter = <this string>` before a drawImage, so there's no per-pixel
 * loop to maintain. */

export type FilterPreset = "none" | "grayscale" | "sepia" | "vivid" | "cool" | "warm";

export const FILTER_PRESETS: { id: FilterPreset; label: string }[] = [
  { id: "none", label: "None" },
  { id: "grayscale", label: "B&W" },
  { id: "sepia", label: "Sepia" },
  { id: "vivid", label: "Vivid" },
  { id: "cool", label: "Cool" },
  { id: "warm", label: "Warm" },
];

const PRESET_FILTERS: Record<FilterPreset, string> = {
  none: "",
  grayscale: "grayscale(1)",
  sepia: "sepia(0.65)",
  vivid: "saturate(1.5) contrast(1.1)",
  cool: "hue-rotate(-12deg) saturate(1.1) brightness(1.02)",
  warm: "sepia(0.25) saturate(1.25) brightness(1.03)",
};

/** brightness/contrast/saturation are percentages where 100 = unchanged.
 * Returns a value usable directly as `ctx.filter` ("none" when nothing is
 * adjusted). Only non-neutral parts are emitted so the string stays short. */
export function buildFilterString(
  brightnessPct: number,
  contrastPct: number,
  saturationPct: number,
  preset: FilterPreset
): string {
  const parts: string[] = [];
  if (brightnessPct !== 100) parts.push(`brightness(${brightnessPct / 100})`);
  if (contrastPct !== 100) parts.push(`contrast(${contrastPct / 100})`);
  if (saturationPct !== 100) parts.push(`saturate(${saturationPct / 100})`);
  if (PRESET_FILTERS[preset]) parts.push(PRESET_FILTERS[preset]);
  return parts.join(" ") || "none";
}

const clampPct = (v: number) => Math.round(Math.min(150, Math.max(50, v * 100)));

/** "Auto" for the editor: picks brightness/contrast/saturation slider values
 * (percentages, clamped to the sliders' 50–150 range) from RGBA pixels —
 * pass a small downscaled sample, a few hundred px is plenty.
 *
 * Levels: CSS applies brightness(b) then contrast(c), i.e.
 * y = (b·x − 0.5)·c + 0.5. Mapping the 1st/99th luma percentiles lo→0 and
 * hi→1 solves to b = 1/(lo+hi), c = (hi+lo)/(hi−lo) — a well-exposed photo
 * (lo≈0, hi≈1) comes back as 100/100, so Auto leaves good photos alone.
 * Saturation then lifts dull colour toward a typical chroma, never down,
 * and skips near-greyscale images so it can't amplify a faint colour cast. */
export function autoAdjust(data: Uint8ClampedArray): { brightness: number; contrast: number; saturation: number } {
  const hist = new Uint32Array(256);
  let n = 0;
  let chromaSum = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue; // transparent PNG areas aren't part of the photo
    const r = data[i], g = data[i + 1], b = data[i + 2];
    hist[Math.round(0.299 * r + 0.587 * g + 0.114 * b)]++;
    chromaSum += Math.max(r, g, b) - Math.min(r, g, b);
    n++;
  }
  const neutral = { brightness: 100, contrast: 100, saturation: 100 };
  if (n === 0) return neutral;

  const percentile = (p: number) => {
    let seen = 0;
    for (let v = 0; v < 256; v++) if ((seen += hist[v]) >= n * p) return v / 255;
    return 1;
  };
  const lo = percentile(0.01);
  const hi = percentile(0.99);
  // A near-solid image (a blank page, a flat colour) has no range to stretch;
  // "fixing" it would only turn white into grey.
  if (hi - lo < 0.1) return neutral;

  const brightness = clampPct(1 / (lo + hi));
  const contrast = clampPct((hi + lo) / (hi - lo));

  // brightness and contrast both scale channel differences, so aim at the
  // chroma the adjusted image will have, not the original's.
  const rawChroma = chromaSum / n / 255;
  const chroma = rawChroma * (brightness / 100) * (contrast / 100);
  const saturation = rawChroma < 0.04 ? 100 : clampPct(Math.min(1.3, Math.max(1, 0.25 / chroma)));

  return { brightness, contrast, saturation };
}
