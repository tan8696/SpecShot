import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolPageSections } from "@/components/ToolPageSections";
import { TOOL_CONTENT } from "@/lib/toolContent";
import { ConvertTool } from "@/components/ConvertTool";

export const metadata: Metadata = {
  alternates: { canonical: "/convert-image/" },
  title: "Convert Image to JPG, PNG or WebP Free | SpecShot",
  description: "Free image converter: change JPG to PNG, PNG to JPG, or WebP to JPG in seconds. Runs in your browser — no upload, no sign-up, no watermark.",
};

export default function ConvertImagePage() {
  const content = TOOL_CONTENT["convert-image"];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
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
