"use client";

import Link from "next/link";
import { TOOLS } from "@/lib/tools";

/** Shown in SiteHeader (SEO pages) and AppShell (the tool itself) — the
 * common way to reach any tool from any page. A handful of direct links
 * plus a native <details> dropdown for the rest, so an 8-entry tool list
 * never becomes an unwieldy tab row (see AppShell's own 3-tab bar, which
 * already needed a mobile-wrap fix at just 3 items). */
export function ToolNav() {
  const primary = TOOLS.filter((t) => t.primary);
  const rest = TOOLS.filter((t) => !t.primary);

  return (
    <nav aria-label="Tools" className="flex flex-wrap items-center gap-1 text-sm">
      {primary.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          className="whitespace-nowrap rounded-md px-2.5 py-1.5 font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          {t.label}
        </Link>
      ))}
      <details className="relative">
        <summary className="cursor-pointer list-none whitespace-nowrap rounded-md px-2.5 py-1.5 font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
          More tools ▾
        </summary>
        <div className="absolute right-0 z-10 mt-1 w-44 rounded-md border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          {rest.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              className="block rounded px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {t.label}
            </Link>
          ))}
        </div>
      </details>
    </nav>
  );
}
