import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { ToolNav } from "./ToolNav";

/** Shared logo/title header for the SEO landing pages (app/photo,
 * app/photo/[slug], app/business) — these have no other path back into the
 * tool. Mirrors AppShell's own header block so a visitor sees the same
 * brand identity wherever they land. `breadcrumb`, when given, renders as a
 * second line under the title — a page-specific nav link distinct from
 * "logo goes home" (e.g. a spec detail page's link back to the spec index). */
export function SiteHeader({ breadcrumb }: { breadcrumb?: { label: string; href: string } }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-3 border-b border-slate-200 pb-6 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-indigo-500/15 font-bold text-indigo-600 dark:text-indigo-300"
        >
          S
        </Link>
        <div>
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-300"
          >
            SpecShot
          </Link>
          {breadcrumb && (
            <p className="text-sm">
              <Link href={breadcrumb.href} className="text-indigo-600 hover:underline dark:text-indigo-400">
                {breadcrumb.label}
              </Link>
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ToolNav />
        <ThemeToggle />
      </div>
    </div>
  );
}
