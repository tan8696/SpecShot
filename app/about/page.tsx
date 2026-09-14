import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "About SpecShot — Why It Exists and How It Works",
  description:
    "SpecShot measures ID photos against published government specifications and runs every tool on your own device. What it does, how it works, and what is verified so far.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 font-body text-on-surface sm:px-6 lg:px-8">
      <SiteHeader />

      <h1 className="font-display text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">About SpecShot</h1>
      <p className="mt-2 text-sm text-outline">Image and document tools that never upload your files.</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-on-surface-variant">
        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">The problem it was built for</h2>
          <p>
            Passport and visa photographs are rejected far more often than most people expect, and the usual reason
            is a measurement nobody can eyeball accurately. Official specifications measure head height from the
            crown &mdash; the very top of the skull, including hair &mdash; down to the chin. Face-detection models,
            on the other hand, almost universally stop at the forehead. The gap between the two is substantial, and
            it is the single most common way an otherwise perfectly good photo ends up failing.
          </p>
          <p className="mt-3">
            SpecShot approaches that measurement differently. It removes the background inside your browser and
            scans the resulting cutout for the actual top of the head, rather than trusting a facial landmark to
            stand in for it. It then crops to the specification&rsquo;s exact head-height and eye-line targets, and
            re-measures the finished image against the same checklist an examiner would work through &mdash; so a
            failure shows up on screen, before you have paid for prints or booked an appointment.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Everything runs on your device</h2>
          <p>
            This is the part that matters most, and it is not a policy promise that could quietly change &mdash; it
            is how the software is built. Face detection, background removal, cropping, compression, format
            conversion, HEIC decoding and PDF assembly all execute as WebAssembly and Canvas code inside your own
            browser tab. There is no upload step and no server that could receive your files, which is also why
            there are no accounts, no passwords and nothing to sign up for.
          </p>
          <p className="mt-3">
            A useful side effect: once the page has loaded, the tools keep working without a connection. You can
            install SpecShot as an app and use it on a plane or underground. Full detail on what is and is not
            stored is in the{" "}
            <Link href="/privacy/" className="text-primary underline hover:text-primary-fixed">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">What is verified, and what is not</h2>
          <p>
            Document specifications are only useful if the numbers are right, so each one is checked against the
            issuing authority&rsquo;s own published source before it goes live. At the time of writing the UK
            passport specification is verified in this way. Specifications for several other countries are drafted
            but deliberately held back from the live site until each has been confirmed against a primary source.
          </p>
          <p className="mt-3">
            That is a slower way to do it, and it means the list of supported documents is shorter than it could
            be. It is the right trade: one specification you can rely on is worth more than twenty that might be
            wrong. SpecShot is also not affiliated with any government or visa service, and no tool can guarantee
            acceptance &mdash; the issuing authority always makes the final decision.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">The rest of the toolkit</h2>
          <p>
            The same on-device engine drives a dozen everyday utilities: resizing, cropping, compressing to an exact
            file size, converting between JPG, PNG and WebP, turning iPhone HEIC photos into something other
            software will open, building PDFs from images and pulling images back out of PDFs, rotating, adding
            watermarks and captioning. They are listed on the{" "}
            <Link href="/tools/" className="text-primary underline hover:text-primary-fixed">
              all tools
            </Link>{" "}
            page.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">How it is paid for</h2>
          <p>
            SpecShot is free, with no paywall, no subscription and no watermark on your results. It is supported by
            advertising, which loads only if you accept the cookie banner on your first visit. Declining means no ad
            script loads and no advertising cookie is set &mdash; and every tool, including downloads, works exactly
            the same either way.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Who makes it</h2>
          <p>
            SpecShot is built and maintained by an independent developer, not a company. Corrections are genuinely
            welcome &mdash; particularly if you spot a specification that has drifted from its official source, or
            have had a photo rejected for a reason the checklist did not catch. The{" "}
            <Link href="/contact/" className="text-primary underline hover:text-primary-fixed">
              contact page
            </Link>{" "}
            has the details.
          </p>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
