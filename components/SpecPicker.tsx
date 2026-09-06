"use client";

import { useEffect, useMemo, useState } from "react";
import type { Spec } from "@/lib/specs";

/**
 * Country-first document search. At 1,200 specs a flat dropdown is unusable,
 * so this narrows by country (native <datalist> — free type-ahead, no JS
 * autocomplete needed) before listing that country's document types.
 *
 * The raw text box value and the committed filter are separate state: if
 * they weren't, every keystroke toward a country name would briefly match
 * nothing and flash "no documents" before the full name was typed.
 */
export function SpecPicker({
  specs,
  slug,
  onChange,
}: {
  specs: Spec[];
  slug: string;
  onChange: (slug: string) => void;
}) {
  const countries = useMemo(() => Array.from(new Set(specs.map((s) => s.country))).sort(), [specs]);
  const selected = specs.find((s) => s.slug === slug) ?? null;

  const [country, setCountry] = useState(selected?.country ?? countries[0] ?? "");
  const [countryInput, setCountryInput] = useState(country);

  const docsForCountry = useMemo(() => specs.filter((s) => s.country === country), [specs, country]);

  function handleCountryInput(value: string) {
    setCountryInput(value);
    if (countries.includes(value)) setCountry(value);
  }

  useEffect(() => {
    if (docsForCountry.length > 0 && !docsForCountry.some((s) => s.slug === slug)) {
      onChange(docsForCountry[0].slug);
    }
    // Only re-run when the committed country (not the derived doc list) changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400" htmlFor="country">
          Country
        </label>
        <input
          id="country"
          list="country-options"
          value={countryInput}
          onChange={(e) => handleCountryInput(e.target.value)}
          placeholder="Search for your country…"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <datalist id="country-options">
          {countries.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        {countryInput !== country && (
          <p className="mt-1 text-xs text-slate-500">
            {countries.includes(countryInput) ? "" : `Showing documents for ${country || "no country yet"}`}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400" htmlFor="document">
          Document
        </label>
        <select
          id="document"
          value={slug}
          onChange={(e) => onChange(e.target.value)}
          disabled={docsForCountry.length === 0}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          {docsForCountry.length === 0 && <option>No documents for this country yet</option>}
          {docsForCountry.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.document}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
