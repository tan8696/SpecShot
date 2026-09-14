import type { Metadata } from "next";
import { PageBackground } from "@/components/PageBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolPageSections } from "@/components/ToolPageSections";
import { TOOL_CONTENT } from "@/lib/toolContent";
import { CropTool } from "@/components/CropTool";

export const metadata: Metadata = {
  title: "Crop Image Online — Free, No Upload — SpecShot",
  description: "Drag a selection rectangle to crop any photo, with aspect-ratio presets or exact numbers. Runs entirely in your browser.",
};

export default function CropImagePage() {
  const content = TOOL_CONTENT["crop-image"];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <PageBackground />
      <SiteHeader />
      <h1 className="font-display text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">Crop Image</h1>
      <p className="mt-2 max-w-3xl text-on-surface-variant">{content.lede}</p>
      <div className="mt-8">
        <CropTool />
      </div>

      <ToolPageSections content={content} howTo="crop an image" />
      <SiteFooter />
    </div>
  );
}
