import type { Metadata } from "next";
import { PageBackground } from "@/components/PageBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolPageSections } from "@/components/ToolPageSections";
import { TOOL_CONTENT } from "@/lib/toolContent";
import { ConvertTool } from "@/components/ConvertTool";

export const metadata: Metadata = {
  title: "Convert Image — JPG, PNG, WebP — Free, No Upload — SpecShot",
  description: "Convert an image between JPG, PNG, and WebP. Runs entirely in your browser — nothing is uploaded.",
};

export default function ConvertImagePage() {
  const content = TOOL_CONTENT["convert-image"];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <PageBackground />
      <SiteHeader />
      <h1 className="font-display text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">Convert Image</h1>
      <p className="mt-2 max-w-3xl text-on-surface-variant">{content.lede}</p>
      <div className="mt-8">
        <ConvertTool />
      </div>

      <ToolPageSections content={content} howTo="convert an image" />
      <SiteFooter />
    </div>
  );
}
