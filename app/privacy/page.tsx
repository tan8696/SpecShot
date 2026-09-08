import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Privacy Policy — SpecShot",
  description: "How SpecShot handles your photos, cookies, and advertising data.",
};

// Contact address is the same placeholder used in WaitlistForm.tsx — swap
// both together once there's a real, monitored inbox.
const CONTACT_EMAIL = "hello@specshot.example";
const LAST_UPDATED = "September 8, 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteHeader />

      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: {LAST_UPDATED}</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            The short version
          </h2>
          <p>
            Any photo, signature, or file you use SpecShot on is processed entirely on your own
            device, inside your browser. It is never uploaded, transmitted, or stored on any
            server — SpecShot has no backend that could receive it even if it wanted to. This
            page covers everything else: the small amount of data that ads, analytics, and
            standard web hosting do involve.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            Photos and files you use SpecShot on
          </h2>
          <p>
            Face detection, background removal, cropping, compression, and signature cleanup all
            run as WebAssembly directly in your browser. The image data never leaves your device.
            Closing the tab or refreshing the page discards it completely — nothing is retained
            anywhere, by us or anyone else.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            Local storage
          </h2>
          <p>
            SpecShot saves one thing in your browser&rsquo;s local storage: your light/dark theme
            preference. It never leaves your device and isn&rsquo;t accessible to us.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            Advertising
          </h2>
          <p>
            SpecShot is free to use and supported by advertising, served through Google AdSense.
            Google and its advertising partners may use cookies and similar technologies to serve
            ads based on your prior visits to this and other websites. You can opt out of
            personalized advertising by visiting{" "}
            <a
              href="https://adssettings.google.com"
              className="text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Ads Settings
            </a>{" "}
            or{" "}
            <a
              href="https://www.aboutads.info/choices"
              className="text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              aboutads.info
            </a>
            . Full detail on how Google handles this data is in{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              className="text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              how Google uses information from sites that use its services
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            Third-party services
          </h2>
          <p>
            The on-device measurement tools (MediaPipe and @imgly/background-removal) load their
            machine-learning models from third-party content delivery networks the first time you
            use them. Those requests — for the model files only, never your photo — may be logged
            by those providers under their own privacy policies.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            Standard web logs
          </h2>
          <p>
            Like virtually any website, SpecShot&rsquo;s hosting provider may automatically log
            standard technical information for security and reliability — IP address, browser
            type, pages visited, and timestamps. This is routine server operation, not something
            SpecShot itself collects or uses.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            Children&rsquo;s privacy
          </h2>
          <p>
            SpecShot is not directed at children under 13 and does not knowingly collect
            information from them.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">
            Changes to this policy
          </h2>
          <p>
            If this policy changes, the &ldquo;Last updated&rdquo; date above will change with it.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-slate-900 dark:text-slate-100">Contact</h2>
          <p>
            Questions about this policy? Reach out at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm">
        <Link href="/terms" className="text-indigo-600 hover:underline dark:text-indigo-400">
          Terms of Service
        </Link>
      </p>
    </div>
  );
}
