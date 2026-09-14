import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolPageSections } from "@/components/ToolPageSections";
import { TOOL_CONTENT } from "@/lib/toolContent";
import { RotateTool } from "@/components/RotateTool";

export const metadata: Metadata = {
  title: "Rotate Image Online — Free, No Upload — SpecShot",
  description: "Rotate a photo in 90° steps, or flip it horizontally/vertically. Runs entirely in your browser — nothing is uploaded.",
};

export default function RotateImagePage() {
  const content = TOOL_CONTENT["rotate-image"];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteHeader />
      <h1 className="font-display text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">Rotate Image</h1>
      <p className="mt-2 max-w-3xl text-on-surface-variant">{content.lede}</p>
      <div className="mt-8">
        <RotateTool />
      </div>

      <ToolPageSections content={content} howTo="rotate an image" />
      <SiteFooter />
    </div>
  );
}
