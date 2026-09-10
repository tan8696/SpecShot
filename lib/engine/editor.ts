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
