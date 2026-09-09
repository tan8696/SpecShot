import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { WatermarkTool } from "@/components/WatermarkTool";

export const metadata: Metadata = {
  title: "Watermark Image Online — Free, No Upload — SpecShot",
  description: "Stamp your own text or logo onto a photo, with adjustable position and opacity. Runs entirely in your browser.",
};

export default function WatermarkImagePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteHeader />
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Watermark Image</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Add your own text or logo to protect a photo before sharing it. Nothing you upload leaves your browser.
      </p>
      <div className="mt-8">
        <WatermarkTool />
      </div>
    </div>
  );
}
