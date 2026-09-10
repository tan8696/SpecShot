import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { PdfToImageTool } from "@/components/PdfToImageTool";

export const metadata: Metadata = {
  title: "PDF to JPG — Convert PDF Pages to Images Free, No Upload — SpecShot",
  description: "Turn every page of a PDF into a JPG image. Runs entirely in your browser — nothing is uploaded.",
};

export default function PdfToJpgPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteHeader />
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">PDF to JPG</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Convert each page of a PDF to a JPG image. Nothing you upload leaves your browser.
      </p>
      <div className="mt-8">
        <PdfToImageTool defaultFormat="jpeg" />
      </div>
    </div>
  );
}
