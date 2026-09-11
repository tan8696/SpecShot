import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { CookiePreferences } from "@/components/CookiePreferences";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cookie Policy — SpecShot",
  description: "What SpecShot stores in your browser, what Google AdSense sets if you accept ads, and how to change your choice.",
};

const LAST_UPDATED = "September 11, 2026";

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 font-body text-on-surface">
      <SiteHeader />

      <h1 className="font-display text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">Cookie Policy</h1>
      <p className="mt-2 text-sm text-outline">Last updated: {LAST_UPDATED}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-on-surface-variant">
        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">The short version</h2>
          <p>
            SpecShot itself sets no cookies at all. The only thing it puts in your browser — session storage for
            passing an image between tools, and one flag remembering your ad-cookie choice — isn&rsquo;t a cookie
            and isn&rsquo;t sent to anyone. The only real cookies come from Google AdSense, and only if you accept
            them below.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Strictly necessary — not cookies</h2>
          <table className="mt-2 w-full border-collapse overflow-hidden rounded-lg text-left text-xs">
            <thead>
              <tr className="bg-surface-container-high text-on-surface">
                <th className="p-2 font-medium">Name</th>
                <th className="p-2 font-medium">Storage</th>
                <th className="p-2 font-medium">Purpose</th>
                <th className="p-2 font-medium">Lifespan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 bg-surface-container-low">
              <tr>
                <td className="p-2 font-mono">specshot:handoff-image</td>
                <td className="p-2">Session storage</td>
                <td className="p-2">Carries one image from a dropzone or &ldquo;send to&rdquo; action to the next tool</td>
                <td className="p-2">Deleted the instant it&rsquo;s read; gone when the tab closes</td>
              </tr>
              <tr>
                <td className="p-2 font-mono">specshot:ad-consent</td>
                <td className="p-2">Local storage</td>
                <td className="p-2">Remembers whether you accepted or declined ad cookies, so we don&rsquo;t ask every visit</td>
                <td className="p-2">Until you clear it (see below) or clear your browser data</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2">Neither of these is ever transmitted anywhere — they exist only inside your browser.</p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Advertising cookies — only if you accept</h2>
          <p>
            SpecShot is free, ad-supported. Ads are served through Google AdSense, but the AdSense script does not
            load — and no ad cookie is set — until you click &ldquo;Accept&rdquo; on the banner shown on your first
            visit. If you accept, Google and its advertising partners may set cookies to measure ads and personalize
            them based on your visits to this and other sites. Full detail is in Google&rsquo;s own{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              className="text-primary underline hover:text-primary-fixed"
              target="_blank"
              rel="noopener noreferrer"
            >
              policy for partner sites
            </a>
            . You can withdraw consent at any time from either place:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>The reset control on this page, below.</li>
            <li>
              Google&rsquo;s own controls —{" "}
              <a href="https://adssettings.google.com" className="text-primary underline hover:text-primary-fixed" target="_blank" rel="noopener noreferrer">
                Ads Settings
              </a>{" "}
              or{" "}
              <a href="https://www.aboutads.info/choices" className="text-primary underline hover:text-primary-fixed" target="_blank" rel="noopener noreferrer">
                aboutads.info
              </a>
              .
            </li>
          </ul>
          <p className="mt-2">Declining, or withdrawing later, never affects any tool — downloads work exactly the same either way.</p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Your choice</h2>
          <CookiePreferences />
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Changes to this policy</h2>
          <p>If this policy changes, the &ldquo;Last updated&rdquo; date above will change with it.</p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Contact</h2>
          <p>
            Questions about cookies on SpecShot? Reach out at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline hover:text-primary-fixed">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>

      <p className="mt-10 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link href="/privacy/" className="text-primary hover:underline">Privacy Policy</Link>
        <Link href="/terms/" className="text-primary hover:underline">Terms of Service</Link>
        <Link href="/data/" className="text-primary hover:underline">Your Data</Link>
      </p>
    </div>
  );
}
