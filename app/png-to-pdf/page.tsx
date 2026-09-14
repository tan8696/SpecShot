import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolPageSections } from "@/components/ToolPageSections";
import { TOOL_CONTENT } from "@/lib/toolContent";
import { ImageToPdfTool } from "@/components/ImageToPdfTool";

export const metadata: Metadata = {
  title: "PNG to PDF — Combine Images into a PDF Free, No Upload — SpecShot",
  description: "Combine several PNG images into a single PDF, one per page. Runs entirely in your browser — nothing is uploaded.",
};

export default function PngToPdfPage() {
  const content = TOOL_CONTENT["png-to-pdf"];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteHeader />
      <h1 className="font-display text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">PNG to PDF</h1>
      <p className="mt-2 max-w-3xl text-on-surface-variant">{content.lede}</p>
      <div className="mt-8">
        <ImageToPdfTool accept="image/png" />
      </div>

      <ToolPageSections content={content} howTo="convert PNG to PDF" />
      <SiteFooter />
    </div>
  );
}
