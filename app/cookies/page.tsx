import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cookie Policy — SpecShot",
  description: "What SpecShot stores in your browser, which cookies Google AdSense may set, and how to control them.",
};

const LAST_UPDATED = "September 22, 2026";

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
            passing an image between tools — isn&rsquo;t a cookie and isn&rsquo;t sent to anyone. Separately, an
            anonymous, cookie-free visit counter (Vercel Web Analytics) runs for every visitor — it can&rsquo;t
            identify you, so there&rsquo;s nothing to consent to. The only real cookies come from Google AdSense,
            which serves the ads — see below for when it asks first and how to opt out.
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
            </tbody>
          </table>
          <p className="mt-2">It&rsquo;s never transmitted anywhere — it exists only inside your browser.</p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Anonymous visit counting — not a cookie either</h2>
          <p>
            SpecShot uses Vercel Web Analytics to count visits and page views in aggregate. It sets no cookie and
            stores nothing in your browser at all — it works by hashing the incoming request, and Vercel discards
            that hash after 24 hours. It can&rsquo;t identify you, follow you across other sites, or be linked to
            anything you do inside a tool. Because it can&rsquo;t identify anyone, it runs for every visitor and
            needs no consent. Full detail is in the{" "}
            <Link href="/privacy/" className="text-primary underline hover:text-primary-fixed">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Advertising cookies</h2>
          <p>
            SpecShot is free, ad-supported. Ads are served through Google AdSense, which loads on every page. Google
            and its advertising partners may set cookies to measure ads and personalize them based on your visits to
            this and other sites. Where the law requires your consent first — including in the EEA, the UK and
            Switzerland — Google asks for it with its own consent message before using cookies for ads, and you can
            change that choice at any time. Full detail is in Google&rsquo;s own{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              className="text-primary underline hover:text-primary-fixed"
              target="_blank"
              rel="noopener noreferrer"
            >
              policy for partner sites
            </a>
            . Wherever you are, you can opt out of personalized ads at any time through Google&rsquo;s own controls —{" "}
            <a href="https://adssettings.google.com" className="text-primary underline hover:text-primary-fixed" target="_blank" rel="noopener noreferrer">
              Ads Settings
            </a>{" "}
            or{" "}
            <a href="https://www.aboutads.info/choices" className="text-primary underline hover:text-primary-fixed" target="_blank" rel="noopener noreferrer">
              aboutads.info
            </a>
            .
          </p>
          <p className="mt-2">Declining, or opting out later, never affects any tool — downloads work exactly the same either way.</p>
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

      <SiteFooter />
    </div>
  );
}
