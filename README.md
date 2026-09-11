# SpecShot

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Client-side only](https://img.shields.io/badge/backend-none-brightgreen)
![License](https://img.shields.io/badge/license-private-lightgrey)

**Turn a selfie into an ID photo that actually meets the spec — then keep
going.** SpecShot began as an ID-photo compliance checker and grew into a
full browser image studio: compress, resize, crop, convert, watermark, HEIC,
image ↔ PDF, a photo editor, and more. Every tool shares one dark workspace
and one rule — nothing you open is ever uploaded.

For an ID photo specifically, SpecShot measures your head height, eye line,
and background against a government's exact published requirements — the same
way an examiner would — and shows you a pass/fail checklist before you
download, not after you've already paid for prints that get rejected.

Every pixel of processing happens **in your browser**. No backend, no API
route, no account. Free to use, supported by a single short ad on download.

## Why this exists

Most "passport photo" sites either eyeball the crop or make you trust a
black box. SpecShot instead:

1. Detects your face and levels the photo (MediaPipe FaceLandmarker)
2. Removes the background to find your **true hairline** — not an
   estimated landmark, which sits 15–40mm too low for a real crown
   measurement (`@imgly/background-removal`, running as WASM)
3. Crops to the government's exact head-height and eye-line targets
4. **Re-measures the finished file** and shows you the same checklist an
   examiner would use — head height, eye line, background, resolution,
   file size — so you see a failure *before* you print, not after

## ✨ Features

| | |
|---|---|
| 🪪 **ID Photo** | Auto crop to any supported document spec, with a visible crown/eye/chin guide overlay and a live compliance checklist. Generate several documents from one photo in a single pass. |
| 🖨️ **Print sheets** | Tile 4–30 copies of your finished photo onto a 4×6in or A4 sheet with cut guides — the thing photo labs charge extra for. |
| 📐 **Resize** | Exact pixels or by percent, with an aspect-ratio lock, on any image. |
| ✂️ **Crop** | Drag a real selection rectangle over any photo, with aspect-ratio presets or exact numbers. |
| ↻ **Rotate** | 90° steps and horizontal/vertical flip. |
| 🔄 **Convert** | Switch between JPG, PNG, and WebP. |
| 🏷️ **Watermark** | Stamp your own text or logo onto a photo — position, opacity, tiled or single. |
| 🎨 **Photo Editor** | Brightness/contrast/saturation, filter presets, border, caption, rotate/flip. |
| 😂 **Meme Generator** | Classic top/bottom Impact captions, auto-wrapped, on any image. |
| 📱 **HEIC → JPG/PNG** | Convert iPhone HEIC/HEIF photos (`heic2any`, WASM, loaded only when used). |
| 📄 **Images ↔ PDF** | Combine images into one PDF (`pdf-lib`), or render every PDF page to JPG/PNG (`pdfjs-dist`). Both loaded only when used. |
| 🗜️ **Compress Photo** | Hit an exact file-size target (KB) or a quality level for any image, not just ID photos. |
| ✍️ **Signature Cleaner** | Photograph a signature on paper; SpecShot crops to the ink, strips shadows, and outputs it at an exact pixel size for exam/visa portals. |
| 📷 **Camera capture** | Take the photo directly in-browser with live face-framing guidance — no separate camera app needed. |
| 🌘 **One dark studio** | Every tool shares the same layout: a stage, a controls panel, and a live readout of output size, dimensions and encode time. No theme toggle — one focused dark surface. |
| 🔗 **Tools chain together** | Send a crop, resize or edit straight into the compressor — the handoff stays in the browser, no round-trip to disk. |
| 📱 **Installable PWA** | Works offline after first load; add-to-home-screen on mobile. |
| 🔍 **SEO spec pages** | Every verified document gets its own page with exact dimensions, cited to the government source. |
| 🔒 **Private by construction** | Face detection and background removal run as WASM in your browser, and re-encoding strips EXIF/GPS metadata on the way out. There is no server that could see your photo, because there is no server. |
| 📺 **Free, ad-supported** | One short ad unlocks a download. No account, no payment, no watermark on the final file. |
| 📜 **Full legal set + consent banner** | Privacy Policy, Cookie Policy, Terms of Service, and a plain-language [Your Data](app/data/page.tsx) page — plus a real cookie-consent banner that gates the AdSense script itself, not just the ad unit. Declining never breaks a tool. |

## Tech stack

- **[Next.js 15](https://nextjs.org)** (App Router, static export — ships as plain HTML/JS/CSS, no Node server needed)
- **React 19** + **TypeScript** (strict mode)
- **Tailwind CSS v4** — Material-3-style dark palette, dark-only, one shared studio frame (`components/studioUi.tsx`)
- **Geist + Inter** via `next/font`, **Material Symbols** for icons
- **[MediaPipe Tasks Vision](https://ai.google.dev/edge/mediapipe)** — face landmark detection
- **[@imgly/background-removal](https://github.com/imgly/background-removal-js)** — in-browser background segmentation
- **`heic2any`** (HEIC decode), **`pdf-lib`** / **`pdfjs-dist`** (PDF write/read), **`ogl`** (landing-page WebGL background) — all loaded only when used
- **Vitest** — unit tests for the measurement/crop/compression/rotate math

## Getting started

```bash
npm install
npm run dev
```

### Build

Production build is a **static export** — a folder of plain files,
deployable to Vercel, Netlify, GitHub Pages, S3, or any static host.

```bash
npm run build   # runs spec validation first, then next build
```

Output goes to `out/`.

### Test

```bash
npm run test        # run once
npm run test:watch  # watch mode
npm run typecheck   # tsc --noEmit
```

## Project structure

```
app/                 Routes: landing page (/), tool hub (/app), one route per
                      tool, per-document SEO pages, /business, /privacy, /terms
components/          One dark "studio" per tool (studioUi.tsx = the shared frame);
                      plus LandingPage, Scanner, PhotoTool, ResultCard, AdGate…
lib/engine/          The actual math: crown detection, crop geometry, encoding,
                      print sheets, watermarking, rotate/straighten — all pure,
                      all unit-tested
lib/handoff.ts       Passes an image from one tool to another, in the browser
specs/               One JSON file per document, cited to a government source
scripts/             Spec data validator (runs before every build)
tests/               Vitest suite for lib/engine
```

## Supported documents

Each spec is either `verified: true` (a human confirmed every number against
the cited government source) or excluded from production builds entirely —
SpecShot would rather show fewer documents than ship an unconfirmed number.

| Country | Document | Status |
|---|---|---|
| 🇬🇧 United Kingdom | Passport | ✅ Verified |
| 🇺🇸 United States | Passport | ⏳ Pending verification |
| 🇨🇦 Canada | Passport | ⏳ Pending verification |

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes, for production | Absolute base URL (e.g. `https://specshot.com`) used in `metadataBase`, `sitemap.xml`, and `robots.txt`. Falls back to a placeholder domain if unset — fine for local dev, wrong for a real deploy. |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | No — only once AdSense-approved | Your AdSense publisher ID (`ca-pub-XXXXXXXXXXXXXXXX`). Unset, no AdSense script loads at all and the ad-gate shows its placeholder box. |
| `NEXT_PUBLIC_ADSENSE_SLOT_ID` | No — only once AdSense-approved | The ad unit's slot ID, from the same AdSense dashboard. |

## Before you go live

- [ ] Set `NEXT_PUBLIC_SITE_URL` to the real production domain on your host.
- [ ] Read through `/privacy`, `/terms`, `/cookies`, and `/data` yourself (or
      have a lawyer do it) before launch — they're accurate to what the code
      actually does today, but they're a template, not a substitute for
      legal advice for your situation.
- [ ] Verify the US and Canada passport photo specs
      (`specs/us-passport-photo.json`, `specs/canada-passport-photo.json`)
      against their primary government sources and flip `"verified": true`
      once confirmed — they're excluded from production builds until then.

### Getting AdSense approved

Google reviews the actual live site, so this has to happen after deploying,
not before. SpecShot ships with the policy prerequisites already in place —
a Privacy Policy, Cookie Policy, Terms of Service, a plain-language data page,
real functioning tools, clear navigation, and a consent banner
(`components/ConsentGate.tsx`) that blocks the AdSense script itself — not
just the ad slot — until a visitor clicks Accept, satisfying Google's EU User
Consent Policy without a third-party CMP. Two things still need a human:

- [ ] Apply at [adsense.google.com](https://www.google.com/adsense/) with the
      live production URL — this can't be done on your behalf, it requires
      your own Google account and Google's manual review.
- [ ] Once approved, set `NEXT_PUBLIC_ADSENSE_CLIENT_ID` and
      `NEXT_PUBLIC_ADSENSE_SLOT_ID` (above) and add
      `public/ads.txt` containing the exact line AdSense's dashboard gives
      you (`google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`) —
      not included here since a wrong/placeholder ID in that file is worse
      than a missing one.

## License

Private — all rights reserved.
