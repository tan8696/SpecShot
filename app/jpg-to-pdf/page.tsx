import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { ImageToPdfTool } from "@/components/ImageToPdfTool";

export const metadata: Metadata = {
  title: "JPG to PDF — Combine Photos into a PDF Free, No Upload — SpecShot",
  description: "Combine several JPG photos into a single PDF, one per page. Runs entirely in your browser — nothing is uploaded.",
};

export default function JpgToPdfPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteHeader />
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">JPG to PDF</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Pick several JPGs, order them, and download one PDF with a page each. Nothing you upload leaves your browser.
      </p>
      <div className="mt-8">
        <ImageToPdfTool accept="image/jpeg" />
      </div>
    </div>
  );
}
