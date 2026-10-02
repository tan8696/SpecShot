import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolPageSections } from "@/components/ToolPageSections";
import { TOOL_CONTENT } from "@/lib/toolContent";
import { WatermarkTool } from "@/components/WatermarkTool";

export const metadata: Metadata = {
  alternates: { canonical: "/watermark-image/" },
  title: "Add Watermark to Photo Online Free | SpecShot",
  description: "Add a text or logo watermark to photos, tiled or single, with adjustable position and opacity. Free, runs in your browser — nothing uploaded.",
};

export default function WatermarkImagePage() {
  const content = TOOL_CONTENT["watermark-image"];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteHeader />
      <h1 className="font-display text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">Watermark Image</h1>
      <p className="mt-2 max-w-3xl text-on-surface-variant">{content.lede}</p>
      <div className="mt-8">
        <WatermarkTool />
      </div>

      <ToolPageSections content={content} howTo="add a watermark" />
      <SiteFooter />
    </div>
  );
}
