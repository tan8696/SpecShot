import type { Metadata } from "next";
import Link from "next/link";
import { WaitlistForm } from "@/components/WaitlistForm";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "SpecShot API for Visa Consultancies & Exam Coaching Centres",
  description: "Bulk ID photo compliance checking and cropping via API — for firms processing photos for many clients at once.",
};

const FEATURES = [
  "The same measurement engine as the consumer tool — crown detection, re-verified compliance, not a rough crop",
  "Bulk processing: send many photos against one or many document specs in a single request",
  "Every spec verified against its government source, not copied from another photo site — the library grows as more documents are checked",
  "No per-seat pricing — pay for renders, not headcount",
];

export default function BusinessPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteHeader />

      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        Processing ID photos for clients by hand?
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Visa consultancies and exam coaching centres use SpecShot's engine directly via API instead of cropping
        photos one at a time in Photoshop.
      </p>

      <ul className="mt-8 space-y-3">
        {FEATURES.map((f) => (
          <li key={f} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
            <span className="text-indigo-500">•</span>
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-8 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800">
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">$0.30</p>
            <p className="text-xs text-slate-500">per render</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">$199–499</p>
            <p className="text-xs text-slate-500">per month, volume plans</p>
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Get early access</h2>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          The API isn&rsquo;t public yet, and the pricing above is indicative rather than final. Leave your details
          and you&rsquo;ll hear first when it opens up.
        </p>
        <WaitlistForm />
      </div>

      <div className="mt-16 space-y-10 border-t border-outline-variant/30 pt-12 text-sm leading-relaxed text-on-surface-variant">
        <section>
          <h2 className="mb-2 font-display text-xl font-semibold tracking-tight text-on-surface">
            The workflow this replaces
          </h2>
          <p>
            A consultancy handling visa applications typically receives photographs by email or messaging app, in
            whatever format the client&rsquo;s phone produced &mdash; frequently HEIC, frequently rotated, almost
            never the right dimensions. Someone then opens each one, crops it by eye against a printed
            specification, checks the file size, and sends it back. It takes a few minutes per applicant, it is
            monotonous, and because the critical measurement is a judgement call, mistakes surface weeks later when
            an application is returned.
          </p>
          <p className="mt-3">
            The cost of an error is not the reprocessing time. It is the appointment the client has to rebook and
            the confidence they lose in the firm that handled it.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl font-semibold tracking-tight text-on-surface">
            What you can use today
          </h2>
          <p>
            The API is still in development, but the measurement engine behind it is already live and free to use
            in the browser &mdash; the same crown detection, the same compliance re-check on the finished file. For
            firms handling a handful of applicants a day, that is often enough on its own, with no waiting list and
            nothing to integrate. Start from the{" "}
            <Link href="/photo/" className="text-primary underline hover:text-primary-fixed">
              document specifications
            </Link>{" "}
            and open the tool from the specification you need.
          </p>
          <p className="mt-3">
            Because the processing happens inside the browser, client photographs never reach a server &mdash;
            which for a firm handling other people&rsquo;s identity documents is usually the part that matters most
            to its own data-protection obligations.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl font-semibold tracking-tight text-on-surface">
            Honest status
          </h2>
          <p>
            To be clear about what exists: the browser tool is live and working now, and the API described on this
            page is not yet available to anyone. The specification library currently covers the documents verified
            against their official sources, and grows as each new one is confirmed rather than in bulk. If you need
            a specific document covered, saying so through the{" "}
            <Link href="/contact/" className="text-primary underline hover:text-primary-fixed">
              contact page
            </Link>{" "}
            genuinely influences what gets verified next.
          </p>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
