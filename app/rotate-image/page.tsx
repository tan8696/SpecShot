import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { RotateTool } from "@/components/RotateTool";

export const metadata: Metadata = {
  title: "Rotate Image Online — Free, No Upload — SpecShot",
  description: "Rotate a photo in 90° steps, or flip it horizontally/vertically. Runs entirely in your browser — nothing is uploaded.",
};

export default function RotateImagePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteHeader />
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Rotate Image</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Fix a sideways or upside-down photo, or mirror it. Nothing you upload leaves your browser.
      </p>
      <div className="mt-8">
        <RotateTool />
      </div>
    </div>
  );
}
