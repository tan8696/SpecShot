import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { MemeTool } from "@/components/MemeTool";

export const metadata: Metadata = {
  title: "Meme Generator — Caption Any Image Free, No Upload — SpecShot",
  description: "Add classic top and bottom captions to any image. Runs entirely in your browser — nothing is uploaded.",
};

export default function MemeGeneratorPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteHeader />
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Meme Generator</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Upload an image, add top and bottom captions, done. Nothing you upload leaves your browser.
      </p>
      <div className="mt-8">
        <MemeTool />
      </div>
    </div>
  );
}
