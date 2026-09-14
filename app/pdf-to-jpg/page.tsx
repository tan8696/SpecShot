import type { Metadata } from "next";
import { PageBackground } from "@/components/PageBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolPageSections } from "@/components/ToolPageSections";
import { TOOL_CONTENT } from "@/lib/toolContent";
import { PdfToImageTool } from "@/components/PdfToImageTool";

export const metadata: Metadata = {
  title: "PDF to JPG — Convert PDF Pages to Images Free, No Upload — SpecShot",
  description: "Turn every page of a PDF into a JPG image. Runs entirely in your browser — nothing is uploaded.",
};

export default function PdfToJpgPage() {
  const content = TOOL_CONTENT["pdf-to-jpg"];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <PageBackground />
      <SiteHeader />
      <h1 className="font-display text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">PDF to JPG</h1>
      <p className="mt-2 max-w-3xl text-on-surface-variant">{content.lede}</p>
      <div className="mt-8">
        <PdfToImageTool defaultFormat="jpeg" />
      </div>

      <ToolPageSections content={content} howTo="convert PDF to JPG" />
      <SiteFooter />
    </div>
  );
}
