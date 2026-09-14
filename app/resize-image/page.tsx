import type { Metadata } from "next";
import { PageBackground } from "@/components/PageBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolPageSections } from "@/components/ToolPageSections";
import { TOOL_CONTENT } from "@/lib/toolContent";
import { ResizeTool } from "@/components/ResizeTool";

export const metadata: Metadata = {
  title: "Resize Image Online — Free, No Upload — SpecShot",
  description: "Resize an image by exact pixels or by percent, with an aspect-ratio lock. Runs entirely in your browser — nothing is uploaded.",
};

export default function ResizeImagePage() {
  const content = TOOL_CONTENT["resize-image"];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <PageBackground />
      <SiteHeader />
      <h1 className="font-display text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">Resize Image</h1>
      <p className="mt-2 max-w-3xl text-on-surface-variant">{content.lede}</p>
      <div className="mt-8">
        <ResizeTool />
      </div>

      <ToolPageSections content={content} howTo="resize an image" />
      <SiteFooter />
    </div>
  );
}
