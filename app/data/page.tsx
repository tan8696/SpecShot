import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Your Data — What SpecShot Collects (Nothing) — SpecShot",
  description: "A plain-language breakdown of exactly what SpecShot does and doesn't do with your photos and data.",
};

const ROWS: { icon: string; q: string; a: string; tone?: "good" }[] = [
  { icon: "photo_camera", q: "Your photos, signatures, PDFs", a: "Never leave your device. There is no upload button that sends them anywhere, because there is no server for them to go to.", tone: "good" },
  { icon: "account_circle", q: "Account information", a: "None exists — there's no sign-up, no login, no password, no email required to use any tool." },
  { icon: "monitoring", q: "Analytics or tracking scripts", a: "None. No pixel, no session recorder, no “how did you use this page” script of any kind." },
  { icon: "fingerprint", q: "A profile of you across visits", a: "Not built. SpecShot has no accounts and no analytics, so there's nothing to link one visit to the next." },
  { icon: "cookie", q: "Cookies", a: "None from SpecShot itself. Google AdSense may set one — only if you accept the banner on your first visit." },
  { icon: "save", q: "Browser storage SpecShot does use", a: "Two small, functional things: a same-tab handoff when you move an image between tools (deleted the instant it's read), and your ad-cookie choice. Neither is ever sent anywhere — see the table below." },
];

export default function DataPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 font-body text-on-surface">
      <SiteHeader />

      <h1 className="font-display text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">Your Data</h1>
      <p className="mt-3 max-w-xl text-on-surface-variant">
        Skip the legal document — here&rsquo;s the plain-language version of what SpecShot collects, in one page.
        The legally binding detail is in the <Link href="/privacy/" className="text-primary underline hover:text-primary-fixed">Privacy Policy</Link>.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ROWS.map((r) => (
          <div key={r.q} className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <span className="material-symbols-outlined text-[18px]">{r.icon}</span>
              </span>
              <h2 className="font-display text-sm font-semibold text-on-surface">{r.q}</h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{r.a}</p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold text-on-surface">Why this is even possible</h2>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
          Most sites that touch photos have to upload them somewhere to process them. SpecShot doesn&rsquo;t, because
          every operation — face detection, background removal, cropping, compression, format conversion,
          watermarking, HEIC decoding, PDF reading and writing, signature cleanup — runs as WebAssembly or Canvas
          code that ships to your browser and executes there. The file never becomes a request your device sends
          out; it stays a local variable in a tab you can close at any time to erase it.
        </p>
      </section>

      <section className="mt-8 overflow-x-auto rounded-xl border border-outline-variant/25">
        <table className="w-full min-w-[500px] border-collapse text-left text-xs">
          <thead>
            <tr className="bg-surface-container-high text-on-surface">
              <th className="p-2.5 font-medium">What</th>
              <th className="p-2.5 font-medium">Where it's stored</th>
              <th className="p-2.5 font-medium">Ever transmitted?</th>
              <th className="p-2.5 font-medium">Gone when</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20 bg-surface-container-low text-on-surface-variant">
            <tr>
              <td className="p-2.5">Your photo / file mid-edit</td>
              <td className="p-2.5">Browser memory (RAM) only</td>
              <td className="p-2.5 text-secondary">Never</td>
              <td className="p-2.5">You close or refresh the tab</td>
            </tr>
            <tr>
              <td className="p-2.5">Cross-tool image handoff</td>
              <td className="p-2.5">Session storage</td>
              <td className="p-2.5 text-secondary">Never</td>
              <td className="p-2.5">Read once, or tab closed</td>
            </tr>
            <tr>
              <td className="p-2.5">Ad-cookie choice</td>
              <td className="p-2.5">Local storage</td>
              <td className="p-2.5 text-secondary">Never</td>
              <td className="p-2.5">You reset it, or clear browser data</td>
            </tr>
            <tr>
              <td className="p-2.5">App code / ML model files</td>
              <td className="p-2.5">Service-worker cache</td>
              <td className="p-2.5">N/A — this is the code, not your data</td>
              <td className="p-2.5">Superseded by the next release, or cleared by you</td>
            </tr>
          </tbody>
        </table>
      </section>

      <p className="mt-10 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link href="/privacy/" className="text-primary hover:underline">Privacy Policy</Link>
        <Link href="/cookies/" className="text-primary hover:underline">Cookie Policy</Link>
        <Link href="/terms/" className="text-primary hover:underline">Terms of Service</Link>
      </p>
    </div>
  );
}
