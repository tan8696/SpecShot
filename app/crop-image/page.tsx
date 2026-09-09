import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { CropTool } from "@/components/CropTool";

export const metadata: Metadata = {
  title: "Crop Image Online — Free, No Upload — SpecShot",
  description: "Drag a selection rectangle to crop any photo, with aspect-ratio presets or exact numbers. Runs entirely in your browser.",
};

export default function CropImagePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteHeader />
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Crop Image</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Drag the selection over your photo, or type exact numbers. Nothing you upload leaves your browser.
      </p>
      <div className="mt-8">
        <CropTool />
      </div>
    </div>
  );
}
