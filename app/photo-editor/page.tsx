import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { PhotoEditorTool } from "@/components/PhotoEditorTool";

export const metadata: Metadata = {
  title: "Photo Editor — Free Online Image Editor, No Upload — SpecShot",
  description: "Adjust brightness, contrast and colour, apply filters, add a border or caption, rotate and flip. Runs entirely in your browser.",
};

export default function PhotoEditorPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteHeader />
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Photo Editor</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Light, colour, filters, a border, a caption, rotate and flip — a quick edit without an account. Nothing you upload leaves your browser.
      </p>
      <div className="mt-8">
        <PhotoEditorTool />
      </div>
    </div>
  );
}
