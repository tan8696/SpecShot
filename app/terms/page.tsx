import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service — SpecShot",
  description: "The terms for using SpecShot's free, ad-supported, browser-based image tools.",
};

const LAST_UPDATED = "September 11, 2026";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 font-body text-on-surface">
      <SiteHeader />

      <h1 className="font-display text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">Terms of Service</h1>
      <p className="mt-2 text-sm text-outline">Last updated: {LAST_UPDATED}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-on-surface-variant">
        <section>
          <p>By using SpecShot, you agree to these terms. If you don&rsquo;t agree, please don&rsquo;t use the site.</p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">The service</h2>
          <p>
            SpecShot is a free, ad-supported set of browser-based tools — cropping ID photos to published document
            specifications, resizing, cropping, rotating, converting, watermarking, compressing, editing, making
            memes, converting HEIC photos, combining images into PDFs and back, and cleaning up signatures. No
            account is required, and no file you process is ever uploaded to a server.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">No guarantee of acceptance</h2>
          <p>
            SpecShot measures your photo against a document&rsquo;s published requirements and shows you the result
            before you download. It is a measurement and cropping tool, not a guarantee. Requirements can change,
            individual examiners can differ in judgment, and SpecShot cannot verify identity, print quality, or
            anything outside the photo itself. You&rsquo;re responsible for confirming your final photo or document
            meets the issuing authority&rsquo;s current requirements before you submit it.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Acceptable use</h2>
          <p>You agree not to use SpecShot to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Process any photo, signature, or document you don&rsquo;t have the right to use — including someone else&rsquo;s identity documents without their permission.</li>
            <li>Create fraudulent, forged, or intentionally misleading identity or travel documents.</li>
            <li>Probe, disrupt, or attempt to circumvent the site&rsquo;s infrastructure, or automate bulk use in a way that degrades it for others.</li>
          </ul>
          <p className="mt-2">
            Because every tool runs on your own device, SpecShot has no way to see what you process and cannot
            monitor for this — responsibility for lawful use rests entirely with you.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Advertising</h2>
          <p>
            SpecShot is supported by advertising served through Google AdSense, shown only after you accept the
            cookie banner. Declining means no ads or ad cookies load, and every tool still works the same way. See
            the <Link href="/privacy/" className="text-primary underline hover:text-primary-fixed">Privacy Policy</Link>{" "}
            and <Link href="/cookies/" className="text-primary underline hover:text-primary-fixed">Cookie Policy</Link> for detail.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">No warranty</h2>
          <p>
            SpecShot is provided &ldquo;as is,&rdquo; without warranty of any kind, express or implied, including any
            warranty of accuracy, fitness for a particular purpose, or uninterrupted availability.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, SpecShot and its operator are not liable for any indirect,
            incidental, or consequential loss or damage arising from your use of the site — including a rejected
            application, a missed deadline, or lost data from a file processed here. Because SpecShot is free and
            nothing you process is ever transmitted to us, our total liability for any claim arising from your use
            of the site is capped at zero.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Governing law</h2>
          <p>
            These terms are governed by the laws of{" "}
            <span className="rounded bg-amber-400/10 px-1.5 py-0.5 font-mono text-xs text-amber-300">
              [operator&rsquo;s jurisdiction — not yet set]
            </span>
            , without regard to its conflict-of-law rules.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Changes</h2>
          <p>These terms may change from time to time. Continuing to use SpecShot after a change means you accept the updated terms.</p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Contact</h2>
          <p>
            Questions about these terms? Reach out at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline hover:text-primary-fixed">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>

      <p className="mt-10 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link href="/privacy/" className="text-primary hover:underline">Privacy Policy</Link>
        <Link href="/cookies/" className="text-primary hover:underline">Cookie Policy</Link>
        <Link href="/data/" className="text-primary hover:underline">Your Data</Link>
      </p>
    </div>
  );
}
