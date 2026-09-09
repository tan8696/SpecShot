import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { ResizeTool } from "@/components/ResizeTool";

export const metadata: Metadata = {
  title: "Resize Image Online — Free, No Upload — SpecShot",
  description: "Resize an image by exact pixels or by percent, with an aspect-ratio lock. Runs entirely in your browser — nothing is uploaded.",
};

export default function ResizeImagePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteHeader />
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Resize Image</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Set an exact width and height, or scale by percent. Nothing you upload leaves your browser.
      </p>
      <div className="mt-8">
        <ResizeTool />
      </div>
    </div>
  );
}
