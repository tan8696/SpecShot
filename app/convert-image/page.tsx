import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { ConvertTool } from "@/components/ConvertTool";

export const metadata: Metadata = {
  title: "Convert Image — JPG, PNG, WebP — Free, No Upload — SpecShot",
  description: "Convert an image between JPG, PNG, and WebP. Runs entirely in your browser — nothing is uploaded.",
};

export default function ConvertImagePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteHeader />
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Convert Image</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Switch between JPG, PNG, and WebP. Nothing you upload leaves your browser.
      </p>
      <div className="mt-8">
        <ConvertTool />
      </div>
    </div>
  );
}
