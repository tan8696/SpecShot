import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Terms of Service — SpecShot",
  description: "The terms for using SpecShot's free, ad-supported photo tools.",
};

const CONTACT_EMAIL = "hello@specshot.example";
const LAST_UPDATED = "September 8, 2026";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteHeader />

      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <section>
          <p>
            By using SpecShot, you agree to these terms. If you don&rsquo;t agree, please don&rsquo;t
            use the site.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            The service
          </h2>
          <p>
            SpecShot is a free, ad-supported set of browser-based tools for cropping ID photos to
            published document specifications, compressing images, and cleaning up signatures. No
            account is required, and no file you process is ever uploaded to a server.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            No guarantee of acceptance
          </h2>
          <p>
            SpecShot measures your photo against a document&rsquo;s published requirements and
            shows you the result before you download. It is a measurement and cropping tool, not a
            guarantee. Requirements can change, individual examiners can differ in judgment, and
            SpecShot cannot verify identity, print quality, or anything outside the photo itself.
            You&rsquo;re responsible for confirming your final photo meets the issuing
            authority&rsquo;s current requirements before you submit it.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            Advertising
          </h2>
          <p>
            SpecShot is supported by advertising served through Google AdSense. Using the site
            means ads may be shown to you as described in the{" "}
            <Link href="/privacy" className="text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            No warranty
          </h2>
          <p>
            SpecShot is provided &ldquo;as is,&rdquo; without warranty of any kind, express or
            implied. To the fullest extent permitted by law, SpecShot and its operator are not
            liable for any loss or damage arising from your use of the site, including a rejected
            application or a missed deadline.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            Changes
          </h2>
          <p>
            These terms may change from time to time. Continuing to use SpecShot after a change
            means you accept the updated terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">Contact</h2>
          <p>
            Questions about these terms? Reach out at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm">
        <Link href="/privacy" className="text-indigo-600 hover:underline dark:text-indigo-400">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
