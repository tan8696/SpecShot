import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "All Tools — SpecShot",
  description: "Every free, browser-based photo tool SpecShot offers — ID photos, resize, crop, rotate, convert, compress, watermark, and signature cleanup.",
};

export default function ToolsIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteHeader />
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">All tools</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Free, ad-supported, and entirely browser-based — nothing you upload ever leaves your device.
      </p>
      <ul className="mt-8 space-y-2">
        {TOOLS.map((t) => (
          <li key={t.id}>
            <Link
              href={t.href}
              className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-indigo-400 dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="font-medium text-slate-900 dark:text-slate-100">{t.label}</span>
              <span className="mt-0.5 block text-sm text-slate-600 dark:text-slate-400">{t.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
