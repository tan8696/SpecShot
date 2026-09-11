import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy — SpecShot",
  description: "Exactly what SpecShot does and doesn't collect: your photos, browser storage, cookies, and advertising data.",
};

const LAST_UPDATED = "September 11, 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 font-body text-on-surface">
      <SiteHeader />

      <h1 className="font-display text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-outline">Last updated: {LAST_UPDATED}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-on-surface-variant">
        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">The short version</h2>
          <p>
            Any photo, signature, or file you use SpecShot on is processed entirely on your own device, inside your
            browser. It is never uploaded, transmitted, or stored on any server — SpecShot has no backend that could
            receive it even if it wanted to. This page covers everything else: the browser storage SpecShot itself
            uses, and the small amount of data that ads and standard web hosting involve. For a plainer-language
            summary, see <Link href="/data/" className="text-primary underline hover:text-primary-fixed">Your Data</Link>.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Photos and files you use SpecShot on</h2>
          <p>
            Face detection, background removal, cropping, resizing, compression, format conversion, watermarking,
            HEIC decoding, PDF assembly, and signature cleanup all run as WebAssembly and Canvas code directly in
            your browser, across every one of SpecShot&rsquo;s tools. The image or document data never leaves your
            device. Closing the tab or refreshing the page discards it completely — nothing is retained anywhere,
            by us or anyone else.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Browser storage SpecShot uses</h2>
          <p>SpecShot stores exactly two things in your browser, both purely functional:</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <strong className="text-on-surface">A one-shot handoff (session storage).</strong> If you drop an image
              on the landing page, or send a result from one tool to another (e.g. &ldquo;send the crop to the
              compressor&rdquo;), the image is held briefly in your browser&rsquo;s session storage so the next page
              can pick it up. It&rsquo;s read once and deleted immediately, and clears entirely when you close the
              tab. It never leaves your device.
            </li>
            <li>
              <strong className="text-on-surface">Your ad-cookie choice (local storage), if SpecShot shows ads.</strong>{" "}
              Whether you accepted or declined ad cookies in the banner — see{" "}
              <Link href="/cookies/" className="text-primary underline hover:text-primary-fixed">Cookie Policy</Link>.
            </li>
          </ul>
          <p className="mt-2">
            If you install SpecShot as an app (PWA) or just revisit it, your browser may also cache the app&rsquo;s
            own code and the machine-learning model files it uses, so it keeps working offline — this is standard
            browser/service-worker asset caching, not a record of anything you&rsquo;ve processed.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Analytics and tracking</h2>
          <p>
            SpecShot runs no analytics, no tracking pixel, and no session-recording script of its own. Nothing about
            how you use the site is collected by SpecShot.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Advertising</h2>
          <p>
            SpecShot is free to use and supported by advertising, served through Google AdSense — but only once you
            accept the cookie banner shown on your first visit. Declining means no AdSense script loads and no ad
            cookie is set; SpecShot&rsquo;s tools and downloads work exactly the same either way. If you accept,
            Google and its advertising partners may use cookies and similar technologies to serve ads based on your
            prior visits to this and other websites. You can opt out of personalized advertising at any time by
            visiting{" "}
            <a
              href="https://adssettings.google.com"
              className="text-primary underline hover:text-primary-fixed"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Ads Settings
            </a>{" "}
            or{" "}
            <a
              href="https://www.aboutads.info/choices"
              className="text-primary underline hover:text-primary-fixed"
              target="_blank"
              rel="noopener noreferrer"
            >
              aboutads.info
            </a>
            . Full detail on how Google handles this data is in{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              className="text-primary underline hover:text-primary-fixed"
              target="_blank"
              rel="noopener noreferrer"
            >
              how Google uses information from sites that use its services
            </a>
            . See the <Link href="/cookies/" className="text-primary underline hover:text-primary-fixed">Cookie Policy</Link> for the full breakdown.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Third-party services</h2>
          <p>
            The on-device measurement tools (MediaPipe, @imgly/background-removal, heic2any, pdf-lib, pdfjs-dist)
            load their WebAssembly and model files from third-party content delivery networks the first time you use
            each tool. Those requests — for the code and model files only, never your photo or document — may be
            logged by those providers under their own privacy policies.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Standard web logs</h2>
          <p>
            Like virtually any website, SpecShot&rsquo;s hosting provider may automatically log standard technical
            information for security and reliability — IP address, browser type, pages visited, and timestamps. This
            is routine server operation, not something SpecShot itself collects or uses.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Your rights</h2>
          <p>
            Because SpecShot never receives, stores, or processes your photos or any personal data on a server,
            there is nothing held about you to access, correct, export, or delete — the browser storage described
            above is entirely under your own control (clear it any time via your browser&rsquo;s settings, or use
            the reset link on the <Link href="/cookies/" className="text-primary underline hover:text-primary-fixed">Cookie Policy</Link> page).
            Where advertising cookies do apply, the opt-outs above cover those. If you believe this is inaccurate or
            have any other privacy question, contact us — see below.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Children&rsquo;s privacy</h2>
          <p>SpecShot is not directed at children under 13 and does not knowingly collect information from them.</p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Changes to this policy</h2>
          <p>If this policy changes, the &ldquo;Last updated&rdquo; date above will change with it.</p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Contact</h2>
          <p>
            Questions about this policy? Reach out at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline hover:text-primary-fixed">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>

      <p className="mt-10 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link href="/data/" className="text-primary hover:underline">Your Data</Link>
        <Link href="/cookies/" className="text-primary hover:underline">Cookie Policy</Link>
        <Link href="/terms/" className="text-primary hover:underline">Terms of Service</Link>
      </p>
    </div>
  );
}
