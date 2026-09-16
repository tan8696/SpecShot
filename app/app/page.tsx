import { Suspense } from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Compress a Photo & Clean a Signature — SpecShot",
  description:
    "Compress a photo to an exact file size in KB, or clean up a scanned signature for a form upload — all in your browser, nothing uploaded.",
};

export default function AppPage() {
  // AppShell reads the ?tool= deep link via useSearchParams, which
  // requires a Suspense boundary to keep this route statically exported
  // rather than forcing a per-request render.
  //
  // The section below it is deliberately server-rendered: AppShell is a client
  // component, so without this the route ships as an empty shell — no text for
  // a crawler, and no route to the privacy policy from the page most visitors
  // actually land on.
  return (
    <>
      <Suspense>
        <AppShell />
      </Suspense>

      <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mt-16 space-y-10 border-t border-outline-variant/30 pt-12 text-sm leading-relaxed text-on-surface-variant">
          <section>
            <h2 className="mb-2 font-display text-xl font-semibold tracking-tight text-on-surface">
              What this does
            </h2>
            <p className="max-w-3xl">
              Two jobs share one workspace. <strong className="text-on-surface">Compress</strong> brings a photo
              under an exact file size in kilobytes without changing its dimensions, which is what upload limits
              usually demand. <strong className="text-on-surface">Signature</strong> cleans up a photographed or
              scanned signature, lifting it off the paper background. The rest of the studio — resize, upscale,
              crop, convert, PDF and the rest — lives on its own page, linked from the nav above.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-xl font-semibold tracking-tight text-on-surface">
              Nothing you open is uploaded
            </h2>
            <p className="max-w-3xl">
              Background removal, cropping and compression all run as WebAssembly and Canvas code
              inside this browser tab. Your photo is never transmitted, because there is no server here to receive
              it &mdash; which is also why there is no account to create. Closing the tab discards everything.
              Details are in the{" "}
              <Link href="/privacy/" className="text-primary underline hover:text-primary-fixed">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>

        <SiteFooter />
      </div>
    </>
  );
}
