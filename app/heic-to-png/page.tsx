import type { Metadata } from "next";
import { PageBackground } from "@/components/PageBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolPageSections } from "@/components/ToolPageSections";
import { TOOL_CONTENT } from "@/lib/toolContent";
import { HeicTool } from "@/components/HeicTool";

export const metadata: Metadata = {
  title: "HEIC to PNG — Convert iPhone Photos Free, No Upload — SpecShot",
  description: "Convert an iPhone HEIC/HEIF photo to a lossless PNG. Runs entirely in your browser — nothing is uploaded.",
};

export default function HeicToPngPage() {
  const content = TOOL_CONTENT["heic-to-png"];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <PageBackground />
      <SiteHeader />
      <h1 className="font-display text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">HEIC to PNG</h1>
      <p className="mt-2 max-w-3xl text-on-surface-variant">{content.lede}</p>
      <div className="mt-8">
        <HeicTool defaultTarget="png" />
      </div>

      <ToolPageSections content={content} howTo="convert HEIC to PNG" />
      <SiteFooter />
    </div>
  );
}
