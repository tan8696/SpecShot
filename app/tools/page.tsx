import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TOOLS } from "@/lib/tools";

export const metadata: Metadata = {
  title: "All Tools — SpecShot",
  description: "Every free, browser-based photo tool SpecShot offers — ID photos, resize, crop, rotate, convert, compress, watermark, and signature cleanup.",
};

export default function ToolsIndexPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteHeader />
      <h1 className="font-display text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">All tools</h1>
      <p className="mt-2 max-w-3xl text-on-surface-variant">
        Free, ad-supported, and entirely browser-based &mdash; nothing you open ever leaves your device. Every tool
        below runs as WebAssembly and Canvas code inside your own tab, so there is no upload step, no account and
        no queue to wait in.
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

      <div className="mt-16 space-y-10 border-t border-outline-variant/30 pt-12 text-sm leading-relaxed text-on-surface-variant">
        <section>
          <h2 className="mb-2 font-display text-xl font-semibold tracking-tight text-on-surface">
            Picking the right tool
          </h2>
          <p>
            Two jobs get confused constantly. <strong className="text-on-surface">Resizing</strong> changes an
            image&rsquo;s pixel dimensions &mdash; use it when a form asks for something like 600&nbsp;&times;&nbsp;600.
            <strong className="text-on-surface"> Compressing</strong> changes the file size in kilobytes while
            leaving the dimensions alone &mdash; use it when the upload limit is stated in KB or MB. A photo can
            easily be the correct dimensions and still be rejected for being too large a file, and the fix for that
            is compression, not resizing.
          </p>
          <p className="mt-3">
            Format matters just as much. JPG suits photographs, PNG suits screenshots, logos and anything needing
            transparency, and WebP usually beats both on size when you control where it is going. If a site refuses
            your iPhone photo outright, the cause is almost always HEIC &mdash; convert it to JPG and the same image
            will go through.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl font-semibold tracking-tight text-on-surface">
            Why nothing is uploaded
          </h2>
          <p>
            Conventional online tools work by sending your file to a server, processing it there and sending it
            back &mdash; which means a copy of your document exists on somebody else&rsquo;s machine, however
            briefly. SpecShot does the processing in the browser instead, so that copy is never created. It also
            means the tools keep working with no connection once the page has loaded, and that there is no account
            to create or queue to wait in. What that does and does not cover is set out in the{" "}
            <Link href="/privacy/" className="text-primary underline hover:text-primary-fixed">
              Privacy Policy
            </Link>
            .
          </p>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
