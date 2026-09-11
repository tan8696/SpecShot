import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findSpec, loadSpecSlugs } from "@/lib/specs";
import { SiteHeader } from "@/components/SiteHeader";

/** One template, one page per verified spec — the actual distribution
 * channel: transactional queries like "Schengen visa photo size" that an AI
 * summary can't answer because the answer is a file, not information. */
export async function generateStaticParams() {
  return loadSpecSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const spec = findSpec(slug);
  if (!spec) return {};

  const title = `${spec.country} ${spec.document} Photo Size — Exact Dimensions & Free Tool — SpecShot`;
  const description = `Official ${spec.country} ${spec.document.toLowerCase()} photo requirements: ${spec.print.width_mm}×${spec.print.height_mm}mm, head ${spec.head.height_mm_min}–${spec.head.height_mm_max}mm. Crop, measure, and verify your photo free in your browser — nothing uploaded.`;

  return { title, description };
}

function mmToIn(mm: number) {
  return (mm / 25.4).toFixed(2);
}

export default async function SpecPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const spec = findSpec(slug);
  if (!spec) notFound();

  const fileSize =
    spec.digital.min_kb != null && spec.digital.max_kb != null
      ? `${spec.digital.min_kb}–${spec.digital.max_kb}KB`
      : spec.digital.max_kb != null
        ? `under ${spec.digital.max_kb}KB`
        : "no fixed limit";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteHeader breadcrumb={{ label: "← All document specs", href: "/photo" }} />

      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        {spec.country} {spec.document} Photo Size
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        {spec.verified
          ? "Exact official dimensions, verified against the government source below — not copied from another photo site."
          : "Draft dimensions, not yet verified against the government source below — this page only exists in local preview and is excluded from production until someone confirms it."}
      </p>

      <div className="mt-8 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
        <dl className="divide-y divide-slate-200 dark:divide-slate-800">
          <Row label="Print size" value={`${spec.print.width_mm} × ${spec.print.height_mm} mm (${mmToIn(spec.print.width_mm)} × ${mmToIn(spec.print.height_mm)} in)`} />
          <Row label="Digital size" value={`${spec.digital.width_px} × ${spec.digital.height_px} px at ${spec.print.dpi} DPI`} />
          <Row label="Head height" value={`${spec.head.height_mm_min}–${spec.head.height_mm_max} mm, crown to chin`} />
          <Row label="Eye line" value={`${spec.eye_line.from_bottom_pct_min}–${spec.eye_line.from_bottom_pct_max}% up from the bottom of the frame`} />
          <Row label="Background" value={`Plain, ${spec.background.color}`} />
          <Row label="File format" value={spec.digital.format.toUpperCase()} />
          <Row label="File size" value={fileSize} />
        </dl>
      </div>

      <h2 className="mt-10 text-lg font-semibold text-slate-900 dark:text-slate-100">Rules</h2>
      <ul className="mt-3 space-y-2">
        {spec.rules.map((rule) => (
          <li key={rule} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
            <span className="text-indigo-500">•</span>
            {rule}
          </li>
        ))}
      </ul>

      <div className="mt-10 rounded-lg border border-indigo-200 bg-indigo-50 p-6 text-center dark:border-indigo-500/30 dark:bg-indigo-500/10">
        <p className="mb-4 text-sm text-slate-700 dark:text-slate-300">
          SpecShot measures your actual photo against these numbers — head height from your real hairline (not an
          estimate), eye position, background — and shows you the result before you download. Nothing is uploaded
          anywhere; it all runs in your browser.
        </p>
        <Link
          href={`/app/?doc=${spec.slug}`}
          className="inline-block rounded-md bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-400"
        >
          Create my {spec.document.toLowerCase()} photo — free
        </Link>
      </div>

      <p className="mt-6 text-xs text-slate-500">
        Source:{" "}
        <a href={spec.source_url} className="underline hover:text-slate-700 dark:hover:text-slate-300" rel="noopener noreferrer" target="_blank">
          {spec.source_url}
        </a>
        {spec.verified_on && ` — verified ${spec.verified_on}`}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right font-medium text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}
