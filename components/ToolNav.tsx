"use client";

import Link from "next/link";
import { TOOLS } from "@/lib/tools";

/** Shown in SiteHeader (SEO pages) and AppShell (the tool itself) — the
 * common way to reach any tool from any page. A handful of direct links
 * plus a native <details> dropdown for the rest. */
export function ToolNav() {
  const primary = TOOLS.filter((t) => t.primary);
  const rest = TOOLS.filter((t) => !t.primary);

  return (
    <nav aria-label="Tools" className="flex flex-wrap items-center gap-1 text-sm">
      {primary.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          className="whitespace-nowrap rounded-lg px-2.5 py-1.5 font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
        >
          {t.label}
        </Link>
      ))}
      <details className="relative">
        <summary className="cursor-pointer list-none whitespace-nowrap rounded-lg px-2.5 py-1.5 font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface">
          More tools ▾
        </summary>
        <div className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-outline-variant/40 bg-surface-container-low p-1 shadow-xl">
          {rest.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              className="block rounded px-3 py-1.5 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              {t.label}
            </Link>
          ))}
        </div>
      </details>
    </nav>
  );
}
