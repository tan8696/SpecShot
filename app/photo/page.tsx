import type { Metadata } from "next";
import Link from "next/link";
import { loadSpecs } from "@/lib/specs";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "ID Photo Requirements by Country & Document — SpecShot",
  description: "Exact, government-sourced photo dimensions for passports, visas, and ID documents by country.",
};

export default function SpecIndexPage() {
  const specs = loadSpecs();
  const byCountry = new Map<string, typeof specs>();
  for (const s of specs) {
    byCountry.set(s.country, [...(byCountry.get(s.country) ?? []), s]);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteHeader />
      <h1 className="font-display text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">
        ID Photo Requirements
      </h1>
      <p className="mt-2 max-w-3xl text-on-surface-variant">
        Exact dimensions and rules, each cited to the official government source it came from. Every specification
        below is checked against the issuing authority&rsquo;s own published page before it appears here &mdash;
        which is why this list is short rather than long.
      </p>

      <div className="mt-8 space-y-6">
        {[...byCountry.entries()].map(([country, docs]) => (
          <div key={country}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {country}
            </h2>
            <ul className="space-y-2">
              {docs.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/photo/${s.slug}`}
                    className="block rounded-lg border border-slate-200 bg-white p-4 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:border-indigo-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {s.document} — {s.print.width_mm}×{s.print.height_mm}mm
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-16 space-y-10 border-t border-outline-variant/30 pt-12 text-sm leading-relaxed text-on-surface-variant">
        <section>
          <h2 className="mb-2 font-display text-xl font-semibold tracking-tight text-on-surface">
            What an examiner actually measures
          </h2>
          <p>
            Document photographs are not judged by eye. Each specification defines a small set of measurements, and
            a photo that misses any of them can be returned regardless of how good it looks. Four rules do most of
            the damage.
          </p>
          <ul className="mt-3 space-y-3">
            <li>
              <strong className="text-on-surface">Head height.</strong> Measured from the crown &mdash; the top of
              the skull including hair &mdash; down to the bottom of the chin, and required to fall inside a narrow
              band of millimetres. This is the rule most often failed, because the crown is genuinely hard to judge
              by eye and easy to confuse with the hairline.
            </li>
            <li>
              <strong className="text-on-surface">Eye line.</strong> The eyes have to sit within a defined band
              measured up from the bottom of the frame. A photo cropped to the right size but positioned too high
              or too low still fails.
            </li>
            <li>
              <strong className="text-on-surface">Background.</strong> Plain and evenly lit, in a colour the
              specification names. Shadows cast onto the wall behind you count as a patterned background.
            </li>
            <li>
              <strong className="text-on-surface">Dimensions and file size.</strong> Printed photos must match an
              exact millimetre size; digital submissions usually add pixel dimensions and a maximum file size in
              kilobytes.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl font-semibold tracking-tight text-on-surface">
            Why so many photos come back
          </h2>
          <p>
            Nearly all avoidable rejections come down to the same handful of causes: the head is too large or too
            small in the frame, a shadow falls across the face or the backdrop, the subject is smiling or their
            mouth is open where a neutral expression is required, glasses produce glare or their frames cross the
            eyes, or hair covers part of the face outline. Photos taken at arm&rsquo;s length also distort facial
            proportions &mdash; standing further back and cropping in gives a far more accurate result.
          </p>
          <p className="mt-3">
            A photo can be perfectly sharp, well lit and still fail on a measurement, which is the frustrating part:
            the problem is usually invisible until someone measures it. Checking the numbers before you print or
            submit costs nothing; finding out afterwards can cost an appointment.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl font-semibold tracking-tight text-on-surface">
            How these specifications are sourced
          </h2>
          <p>
            Every page linked above cites the government page its numbers came from, and is only published once
            those numbers have been confirmed against that source. Specifications for further countries are drafted
            but deliberately withheld until each is verified. Requirements do change, so treat the linked official
            page as the final word &mdash; and if you spot a discrepancy, the{" "}
            <Link href="/contact/" className="text-primary underline hover:text-primary-fixed">
              contact page
            </Link>{" "}
            is the fastest way to get it corrected.
          </p>
          <p className="mt-3">
            SpecShot is not affiliated with any government, embassy or visa service, and no tool can guarantee that
            a photo will be accepted &mdash; the issuing authority always makes the final decision.
          </p>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
