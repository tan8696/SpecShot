import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { HeicTool } from "@/components/HeicTool";

export const metadata: Metadata = {
  title: "HEIC to PNG — Convert iPhone Photos Free, No Upload — SpecShot",
  description: "Convert an iPhone HEIC/HEIF photo to a lossless PNG. Runs entirely in your browser — nothing is uploaded.",
};

export default function HeicToPngPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteHeader />
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">HEIC to PNG</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Convert an iPhone HEIC/HEIF photo to a lossless PNG. Nothing you upload leaves your browser.
      </p>
      <div className="mt-8">
        <HeicTool defaultTarget="png" />
      </div>
    </div>
  );
}
