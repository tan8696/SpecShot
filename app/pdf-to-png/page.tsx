import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolPageSections } from "@/components/ToolPageSections";
import { TOOL_CONTENT } from "@/lib/toolContent";
import { PdfToImageTool } from "@/components/PdfToImageTool";

export const metadata: Metadata = {
  alternates: { canonical: "/pdf-to-png/" },
  title: "PDF to PNG Converter — Free, No Upload | SpecShot",
  description: "Convert every page of a PDF to a lossless PNG image free. Runs in your browser — your PDF is never uploaded. No sign-up.",
};

export default function PdfToPngPage() {
  const content = TOOL_CONTENT["pdf-to-png"];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteHeader />
      <h1 className="font-display text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">PDF to PNG</h1>
      <p className="mt-2 max-w-3xl text-on-surface-variant">{content.lede}</p>
      <div className="mt-8">
        <PdfToImageTool defaultFormat="png" />
      </div>

      <ToolPageSections content={content} howTo="convert PDF to PNG" />
      <SiteFooter />
    </div>
  );
}
