#!/usr/bin/env node
/**
 * Generates the PWA app icons as plain RGBA PNGs using only Node's zlib —
 * no canvas/image package, no hand-copied base64 (one wrong character in a
 * multi-KB base64 blob silently corrupts a PNG, which isn't worth the risk
 * for a solid-color brand mark). Indigo rounded square, matching the
 * in-app logo mark's color; a simple blocky "S" is drawn from rectangles.
 */
import fs from "node:fs";
import zlib from "node:zlib";
import path from "node:path";

const INDIGO = [99, 102, 241]; // Tailwind indigo-500, matches the in-app logo mark
const WHITE = [255, 255, 255];

function crcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
}
const CRC_TABLE = crcTable();

function crc32Buf(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32Buf(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

/** Rounded-rect + blocky "S" mask, sampled per-pixel. Returns true if
 * (x, y) should be drawn white (the "S"), false for the indigo background,
 * null for fully transparent (outside the rounded corner). */
function pixelIsLetter(x, y, size) {
  const s = size / 24; // 24-unit design grid, scaled to icon size
  const gx = x / s;
  const gy = y / s;
  // Three horizontal bars + two connecting verticals make a blocky "S"
  // inside a 16x16 unit box centered in the 24x24 grid.
  const bars = [
    [4, 4, 16, 3], // top bar
    [4, 4, 3, 8], // upper-left vertical
    [4, 10.5, 16, 3], // middle bar
    [17, 10.5, 3, 8], // lower-right vertical
    [4, 17, 16, 3], // bottom bar
  ];
  return bars.some(([bx, by, bw, bh]) => gx >= bx && gx < bx + bw && gy >= by && gy < by + bh);
}

function cornerAlpha(x, y, size, radius) {
  const cx = x < radius ? radius : x >= size - radius ? size - radius - 1 : null;
  const cy = y < radius ? radius : y >= size - radius ? size - radius - 1 : null;
  if (cx === null || cy === null) return 255;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist <= radius - 1) return 255;
  if (dist >= radius + 1) return 0;
  return Math.round(255 * (radius + 1 - dist) / 2);
}

/** `foreground`: an Android adaptive-icon layer — the letter alone on
 * transparent, drawn inside the central 64 of 108dp so no launcher mask
 * shape clips it. The indigo comes from the adaptive icon's background. */
function makeIcon(size, { foreground = false } = {}) {
  const radius = Math.round(size * 0.22);
  const inset = foreground ? (size * 22) / 108 : 0;
  const grid = foreground ? (size * 64) / 108 : size;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let offset = 0;
  for (let y = 0; y < size; y++) {
    raw[offset++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const letter = pixelIsLetter(x - inset, y - inset, grid);
      const [r, g, b] = letter ? WHITE : INDIGO;
      const a = foreground ? (letter ? 255 : 0) : cornerAlpha(x, y, size, radius);
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// `--android <res dir>`: launcher icons and splash for the Capacitor APK
// (.github/workflows/apps.yml), replacing the Capacitor placeholders.
const androidRes = process.argv[2] === "--android" ? process.argv[3] : null;

if (androidRes) {
  // Legacy icons are 48dp, adaptive foregrounds 108dp, at each density.
  const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
  for (const [density, k] of Object.entries(densities)) {
    const dir = path.join(androidRes, `mipmap-${density}`);
    fs.writeFileSync(path.join(dir, "ic_launcher.png"), makeIcon(48 * k));
    fs.writeFileSync(path.join(dir, "ic_launcher_round.png"), makeIcon(48 * k));
    fs.writeFileSync(path.join(dir, "ic_launcher_foreground.png"), makeIcon(108 * k, { foreground: true }));
  }
  const hex = "#" + INDIGO.map((c) => c.toString(16).padStart(2, "0")).join("");
  fs.writeFileSync(
    path.join(androidRes, "values", "ic_launcher_background.xml"),
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${hex}</color>
</resources>
`
  );
  // Capacitor's splash is its own logo; launch onto the site's dark surface instead.
  for (const dir of fs.readdirSync(androidRes)) fs.rmSync(path.join(androidRes, dir, "splash.png"), { force: true });
  fs.writeFileSync(
    path.join(androidRes, "drawable", "splash.xml"),
    `<?xml version="1.0" encoding="utf-8"?>
<color xmlns:android="http://schemas.android.com/apk/res/android" android:color="#131313" />
`
  );
  console.log("wrote Android icons and splash into", androidRes);
} else {
  const outDir = path.join(process.cwd(), "public");
  fs.mkdirSync(outDir, { recursive: true });
  for (const size of [192, 512]) {
    const file = path.join(outDir, `icon-${size}.png`);
    fs.writeFileSync(file, makeIcon(size));
    console.log("wrote", file);
  }
}
