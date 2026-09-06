import fs from "node:fs";
import path from "node:path";

export type Spec = {
  slug: string;
  country: string;
  document: string;
  aliases: string[];
  print: { width_mm: number; height_mm: number; dpi: number };
  digital: {
    width_px: number;
    height_px: number;
    max_kb?: number;
    min_kb?: number;
    format: "jpeg" | "png";
  };
  head: { height_mm_min: number; height_mm_max: number };
  eye_line: { from_bottom_pct_min: number; from_bottom_pct_max: number };
  background: { color: string; tolerance: number };
  rules: string[];
  source_url: string;
  verified: boolean;
  verified_on: string | null;
};

const SPEC_DIR = path.join(process.cwd(), "specs");

let _cache: Spec[] | null = null;

/** Read at build time. Every page is statically generated from this. */
export function loadSpecs(): Spec[] {
  if (_cache) return _cache;

  const files = fs.readdirSync(SPEC_DIR).filter((f) => f.endsWith(".json"));
  const specs = files.map((f) => {
    const raw = fs.readFileSync(path.join(SPEC_DIR, f), "utf8");
    return JSON.parse(raw) as Spec;
  });

  // An unverified spec is a made-up millimetre range. Publishing one produces
  // photos that get rejected, which is the single failure this product cannot
  // survive, because accuracy is the entire pitch. Drop them from production
  // builds rather than trusting anyone to remember.
  _cache =
    process.env.NODE_ENV === "production"
      ? specs.filter((s) => s.verified === true)
      : specs;

  return _cache;
}

export function loadSpecSlugs() {
  return loadSpecs().map((s) => s.slug);
}

export function findSpec(slug: string) {
  return loadSpecs().find((s) => s.slug === slug) ?? null;
}
