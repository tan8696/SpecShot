"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { TOOLS } from "@/lib/tools";

/** Shown in SiteHeader (SEO pages) and AppShell (the tool itself) — the
 * common way to reach any tool from any page. A handful of direct links
 * plus a native <details> dropdown for the rest. On phones the direct links
 * fold into that dropdown, so the header stays one row. */
export function ToolNav() {
  const primary = TOOLS.filter((t) => t.primary);
  const rest = TOOLS.filter((t) => !t.primary);
  const menu = useRef<HTMLDetailsElement>(null);

  // A <details> only closes from its own summary. On a phone the open panel
  // covers the page, so also close it on a tap outside or on a pick (a pick
  // that stays on this page, like Compress ↔ Signature, never remounts it).
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (menu.current && !menu.current.contains(e.target as Node)) menu.current.open = false;
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  return (
    <nav aria-label="Tools" className="flex items-center gap-1 text-sm">
      {primary.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          className="hidden whitespace-nowrap rounded-lg px-2.5 py-1.5 font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface sm:inline-block"
        >
          {t.label}
        </Link>
      ))}
      <details ref={menu} className="relative">
        <summary className="flex cursor-pointer list-none items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1.5 font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface">
          {/* Wrapped: the icon font's own CSS sets display and would beat sm:hidden. */}
          <span className="flex items-center gap-1 sm:hidden">
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">menu</span>
            Tools
          </span>
          <span className="hidden sm:inline">More tools ▾</span>
        </summary>
        <div
          onClick={() => menu.current && (menu.current.open = false)}
          className="absolute right-0 z-30 mt-1 max-h-[70vh] w-56 overflow-y-auto rounded-lg border border-outline-variant/40 bg-surface-container-low p-1 shadow-xl sm:w-44"
        >
          {primary.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              className="block rounded px-3 py-2.5 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface sm:hidden"
            >
              {t.label}
            </Link>
          ))}
          {rest.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              className="block rounded px-3 py-2.5 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface sm:py-1.5"
            >
              {t.label}
            </Link>
          ))}
        </div>
      </details>
    </nav>
  );
}
