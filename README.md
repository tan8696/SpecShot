# SpecShot

Turn a selfie into an ID photo that meets an exact government spec — crop,
measure, compress, and clean up a signature, all in the browser. Nothing you
upload ever leaves your device: face detection (MediaPipe) and background
removal (@imgly/background-removal) run as WASM in the browser, and there is
no backend or API route to send a photo to.

## Development

    npm install
    npm run dev

## Build

Production build is a static export — a folder of static files with no Node
server required, deployable to any static host.

    npm run build

Output goes to `out/`. This also runs spec validation first
(`validate:strict`) and fails the build if a spec file is structurally wrong.

## Test

    npm run test        # run once
    npm run test:watch  # watch mode
    npm run typecheck   # tsc --noEmit

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes, for production | Absolute base URL (e.g. `https://specshot.com`) used in `metadataBase`, `sitemap.xml`, and `robots.txt`. Falls back to a placeholder domain if unset — fine for local dev, wrong for a real deploy. |

## Before you go live

- [ ] Set `NEXT_PUBLIC_SITE_URL` to the real production domain on your host.
- [ ] Replace the placeholder waitlist address in `components/WaitlistForm.tsx`
      (`hello@specshot.example`) with a real, monitored inbox.
- [ ] Verify the US and Canada passport photo specs
      (`specs/us-passport-photo.json`, `specs/canada-passport-photo.json`)
      against their primary government sources and flip `"verified": true`
      once confirmed — they're excluded from production builds until then.
