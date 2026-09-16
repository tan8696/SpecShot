import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolPageSections } from "@/components/ToolPageSections";
import { TOOL_CONTENT } from "@/lib/toolContent";
import { UpscaleTool } from "@/components/UpscaleTool";

export const metadata: Metadata = {
  title: "Upscale Image Online — Enlarge & Sharpen, No Upload — SpecShot",
  description:
    "Enlarge a photo 2×, 3× or 4× with a stepped resample and an unsharp mask, so it stays as crisp as an enlargement can be. Runs entirely in your browser — nothing is uploaded.",
};

export default function UpscaleImagePage() {
  const content = TOOL_CONTENT["upscale-image"];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteHeader />
      <h1 className="font-display text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">Upscale Image</h1>
      <p className="mt-2 max-w-3xl text-on-surface-variant">{content.lede}</p>
      <div className="mt-8">
        <UpscaleTool />
      </div>

      <ToolPageSections content={content} howTo="upscale an image" />
      <SiteFooter />
    </div>
  );
}
