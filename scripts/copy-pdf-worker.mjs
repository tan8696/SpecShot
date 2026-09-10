#!/usr/bin/env node
/**
 * pdfjs-dist ships its worker as a separate file. The PDF -> image tool
 * loads it from a fixed URL (/pdf.worker.min.mjs), so it has to sit in
 * public/. Copied here rather than committed so it can't drift from the
 * installed pdfjs-dist version. Runs before `dev` and `build`.
 */
import { copyFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const src = path.join(root, "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const dest = path.join(root, "public", "pdf.worker.min.mjs");

if (!existsSync(src)) {
  console.error(`pdfjs-dist worker not found at ${src} — run npm install`);
  process.exit(1);
}
copyFileSync(src, dest);
console.log("copied pdf.worker.min.mjs -> public/");
