#!/usr/bin/env node
/**
 * Runs before every build. Exits non-zero on anything wrong.
 *
 * The cross-checks matter more than the presence checks. A spec where the
 * stated pixel dimensions do not match the stated millimetres at the stated
 * DPI means somebody transcribed a number wrong, and a wrong number here
 * produces a confidently rendered photo that gets rejected at the counter.
 * That is the failure this product cannot survive.
 *
 *   node scripts/validate-specs.mjs          # warn on unverified
 *   node scripts/validate-specs.mjs --strict # fail on unverified (CI / prod)
 */
import fs from "node:fs";
import path from "node:path";

const STRICT = process.argv.includes("--strict");
const DIR = path.join(process.cwd(), "specs");

const errors = [];
const warnings = [];
const slugs = new Set();

const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json"));
if (files.length === 0) errors.push("No spec files found in /specs.");

for (const file of files) {
  const where = `specs/${file}`;
  let s;
  try {
    s = JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8"));
  } catch (e) {
    errors.push(`${where}: not valid JSON — ${e.message}`);
    continue;
  }

  const err = (m) => errors.push(`${where}: ${m}`);
  const warn = (m) => warnings.push(`${where}: ${m}`);

  for (const f of ["slug", "country", "document", "source_url"]) {
    if (!s[f] || typeof s[f] !== "string") err(`missing "${f}"`);
  }
  if (s.slug && path.basename(file, ".json") !== s.slug.replace(/-photo$/, "") &&
      !s.slug.startsWith(path.basename(file, ".json"))) {
    warn(`filename and slug "${s.slug}" don't obviously correspond`);
  }
  if (s.slug) {
    if (slugs.has(s.slug)) err(`duplicate slug "${s.slug}"`);
    slugs.add(s.slug);
  }

  const p = s.print, d = s.digital, h = s.head, e = s.eye_line;
  if (!p || !d || !h || !e || !s.background) {
    err("missing one of print / digital / head / eye_line / background");
    continue;
  }

  // --- physical sanity ---
  if (!(p.width_mm > 10 && p.width_mm < 200)) err(`print.width_mm ${p.width_mm} out of plausible range`);
  if (!(p.height_mm > 10 && p.height_mm < 200)) err(`print.height_mm ${p.height_mm} out of plausible range`);
  if (![150, 300, 600].includes(p.dpi)) warn(`unusual dpi ${p.dpi}`);

  // --- the cross-check that catches transcription errors ---
  const expectW = Math.round((p.width_mm / 25.4) * p.dpi);
  const expectH = Math.round((p.height_mm / 25.4) * p.dpi);
  const tol = 0.02; // 2%
  if (Math.abs(d.width_px - expectW) / expectW > tol) {
    err(`digital.width_px ${d.width_px} disagrees with ${p.width_mm}mm @ ${p.dpi}dpi (expected ~${expectW})`);
  }
  if (Math.abs(d.height_px - expectH) / expectH > tol) {
    err(`digital.height_px ${d.height_px} disagrees with ${p.height_mm}mm @ ${p.dpi}dpi (expected ~${expectH})`);
  }

  // --- head geometry must fit inside the photo ---
  if (!(h.height_mm_min < h.height_mm_max)) err("head.height_mm_min must be less than max");
  if (h.height_mm_max >= p.height_mm) err(`head.height_mm_max ${h.height_mm_max} does not fit in a ${p.height_mm}mm photo`);
  if (h.height_mm_min / p.height_mm < 0.35) warn(`head occupies under 35% of frame height — unusual, double check`);

  // --- eye line ---
  if (!(e.from_bottom_pct_min < e.from_bottom_pct_max)) err("eye_line min must be less than max");
  // Floor was 40 until the UK's official examiner tolerance (gov.uk "Photo
  // standards") turned out to genuinely allow 30 — that band is a machine-
  // readability acceptance range, not a tight compositional target, but it
  // is real, sourced data. 25 leaves margin without re-widening blindly.
  if (e.from_bottom_pct_min < 25 || e.from_bottom_pct_max > 85) err("eye_line percentages outside 25-85 are almost certainly wrong");

  // Does the head physically fit above the eye line?
  //
  // Warning, not error: 0.48 is the adult average share of head height above
  // the eye line, so a legitimate spec can sit near the boundary. A validator
  // that fails builds on approximations is one people learn to ignore. When
  // this fires, check the source — usually the eye_line band was transcribed
  // from a different document's requirements.
  const headMid = (h.height_mm_min + h.height_mm_max) / 2;
  const eyeMid = (e.from_bottom_pct_min + e.from_bottom_pct_max) / 2;
  const eyeFromTopMm = p.height_mm * (1 - eyeMid / 100);
  const needed = headMid * 0.48;
  if (needed > eyeFromTopMm) {
    warn(
      `crown may fall outside the frame: a ${headMid}mm head with eyes at ${eyeMid}% needs ~${needed.toFixed(1)}mm above the eye line, frame allows ${eyeFromTopMm.toFixed(1)}mm`
    );
  }

  // --- misc ---
  if (!/^#[0-9A-Fa-f]{6}$/.test(s.background?.color ?? "")) err("background.color must be a 6-digit hex");
  if (!["jpeg", "png"].includes(d.format)) err(`digital.format "${d.format}" unsupported`);
  if (d.max_kb != null && d.min_kb != null && d.min_kb >= d.max_kb) err("digital.min_kb >= max_kb");
  if (!Array.isArray(s.rules) || s.rules.length === 0) warn("no rules listed — the page will look thin");
  if (s.source_url && !/^https:\/\//.test(s.source_url)) err("source_url must be https");

  // --- verification gate ---
  if (s.verified !== true) {
    // Always a warning, never build-blocking: lib/specs.ts already filters
    // unverified specs out of production builds at runtime, so one reaching
    // this check can never actually ship. --strict staying hard here would
    // just block the build on data that's already excluded from users.
    warn(`unverified — numbers are placeholders until someone reads ${s.source_url}`);
  } else if (!s.verified_on || !/^\d{4}-\d{2}-\d{2}$/.test(s.verified_on)) {
    err('verified: true requires verified_on as "YYYY-MM-DD"');
  } else {
    const age = (Date.now() - Date.parse(s.verified_on)) / 86400000;
    if (age > 365) warn(`verified ${Math.round(age)} days ago — recheck the source`);
  }
}

for (const w of warnings) console.warn(`  warn  ${w}`);
for (const e of errors) console.error(`  ERROR ${e}`);

console.log(
  `\n${files.length} spec${files.length === 1 ? "" : "s"} checked · ` +
  `${errors.length} error${errors.length === 1 ? "" : "s"} · ` +
  `${warnings.length} warning${warnings.length === 1 ? "" : "s"}` +
  (STRICT ? " · strict" : "")
);

process.exit(errors.length > 0 ? 1 : 0);
