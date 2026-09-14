import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact SpecShot",
  description:
    "Get in touch about a document specification, a bug, a privacy question or business use of SpecShot.",
};

const TOPICS: { heading: string; body: string }[] = [
  {
    heading: "A specification looks wrong",
    body: "The most valuable message you can send. If a measurement here disagrees with what the issuing authority publishes, say which document and link the official page — it will be checked against the primary source and corrected.",
  },
  {
    heading: "A photo was rejected anyway",
    body: "If an application was turned down for a photo that passed the checklist here, the reason given is genuinely useful. It usually points at a rule worth adding.",
  },
  {
    heading: "Something is broken",
    body: "Include the browser and device you were using and what you were trying to do. Please do not attach the photo itself — it is never needed, and it never leaves your device unless you deliberately send it.",
  },
  {
    heading: "Privacy questions",
    body: "Anything about what is stored, what advertising involves, or how to clear what the site has kept in your browser. The Privacy Policy and Your Data pages cover most of it in detail.",
  },
  {
    heading: "Business and bulk use",
    body: "For visa consultancies, studios and coaching centres processing photos in volume — see the business page for what exists today.",
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 font-body text-on-surface sm:px-6 lg:px-8">
      <SiteHeader />

      <h1 className="font-display text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">Contact</h1>
      <p className="mt-2 text-sm text-outline">One person reads these, so plain email works best.</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-on-surface-variant">
        <section className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Email</h2>
          <p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-display text-lg text-primary underline hover:text-primary-fixed"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="mt-2">
            SpecShot is maintained by one independent developer rather than a support team, so replies are not
            instant &mdash; but every message is read. There is no contact form here on purpose: a form would mean
            sending what you write to a third-party service, which is exactly what the rest of the site avoids.
          </p>
        </section>

        <section>
          <h2 className="mb-3 font-display text-base font-semibold text-on-surface">What to get in touch about</h2>
          <dl className="space-y-4">
            {TOPICS.map((topic) => (
              <div key={topic.heading}>
                <dt className="font-display text-sm font-semibold text-on-surface">{topic.heading}</dt>
                <dd className="mt-1">{topic.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-on-surface">Before you write</h2>
          <p>
            A few questions come up often enough to answer here. SpecShot is not affiliated with any government,
            embassy or visa service, and cannot check the status of an application or influence a decision. It
            cannot recover a photo you have lost &mdash; files are processed in your browser and never stored, so
            there is no copy of anything you have opened. And no tool can guarantee acceptance: the issuing
            authority always makes the final call.
          </p>
          <p className="mt-3">
            For what is collected and what is not, see the{" "}
            <Link href="/privacy/" className="text-primary underline hover:text-primary-fixed">
              Privacy Policy
            </Link>{" "}
            and the plain-language{" "}
            <Link href="/data/" className="text-primary underline hover:text-primary-fixed">
              Your Data
            </Link>{" "}
            summary.
          </p>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
