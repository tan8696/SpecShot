import Link from "next/link";
import { ToolNav } from "./ToolNav";

/** Shared logo/title header for the SEO landing pages (app/photo,
 * app/photo/[slug], app/business) — these have no other path back into the
 * tool. Mirrors AppShell's own header block so a visitor sees the same
 * brand identity wherever they land. `breadcrumb`, when given, renders as a
 * second line under the title. */
export function SiteHeader({ breadcrumb }: { breadcrumb?: { label: string; href: string } }) {
  return (
    <div className="mb-8 flex items-center justify-between gap-3 border-b border-outline-variant/30 pb-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-container font-display text-sm font-bold text-on-primary-container"
        >
          S
        </Link>
        <div>
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-tight text-on-surface transition-colors hover:text-primary"
          >
            SpecShot
          </Link>
          {breadcrumb && (
            <p className="text-sm">
              <Link href={breadcrumb.href} className="text-primary transition-colors hover:text-primary-fixed">
                {breadcrumb.label}
              </Link>
            </p>
          )}
        </div>
      </div>
      <ToolNav />
    </div>
  );
}
