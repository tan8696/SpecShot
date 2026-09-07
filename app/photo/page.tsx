import type { Metadata } from "next";
import Link from "next/link";
import { loadSpecs } from "@/lib/specs";
import { SiteHeader } from "@/components/SiteHeader";

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
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        ID Photo Requirements
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Exact dimensions and rules, each cited to its official government source.
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
    </div>
  );
}
