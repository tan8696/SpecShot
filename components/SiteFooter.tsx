import Link from "next/link";
import { APP_DOWNLOAD_URL, CONTACT_EMAIL } from "@/lib/site";

/**
 * Shared footer for every page that isn't the landing page — the landing page
 * has its own larger footer with the full tool directory.
 *
 * The legal and contact links used to live only on the landing page, which
 * meant a visitor arriving straight onto a tool route had no route to the
 * privacy policy at all. These links need to be reachable from every page.
 */
const LINKS: [label: string, href: string][] = [
  ["About", "/about/"],
  ["Contact", "/contact/"],
  ["All tools", "/tools/"],
  ["Document specs", "/photo/"],
  ["Privacy", "/privacy/"],
  ["Cookies", "/cookies/"],
  ["Your data", "/data/"],
  ["Terms", "/terms/"],
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-outline-variant/30 pt-8 text-sm text-on-surface-variant">
      <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
        {LINKS.map(([label, href]) => (
          <Link key={href} href={href} className="transition-colors hover:text-on-surface">
            {label}
          </Link>
        ))}
        {/* Hidden inside the apps themselves (NEXT_PUBLIC_NATIVE_APP). */}
        {!process.env.NEXT_PUBLIC_NATIVE_APP && (
          <a href={APP_DOWNLOAD_URL} className="transition-colors hover:text-on-surface">
            Download the app
          </a>
        )}
      </nav>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-outline">
        <p>
          SpecShot — image and document tools that run entirely in your browser. Nothing you open is ever uploaded.
        </p>
        <a href={`mailto:${CONTACT_EMAIL}`} className="transition-colors hover:text-on-surface-variant">
          {CONTACT_EMAIL}
        </a>
      </div>
    </footer>
  );
}
