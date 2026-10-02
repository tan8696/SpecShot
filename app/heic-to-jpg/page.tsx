import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolPageSections } from "@/components/ToolPageSections";
import { TOOL_CONTENT } from "@/lib/toolContent";
import { HeicTool } from "@/components/HeicTool";

export const metadata: Metadata = {
  alternates: { canonical: "/heic-to-jpg/" },
  title: "HEIC to JPG Converter — Free, No Upload | SpecShot",
  description: "Convert iPhone HEIC photos to JPG free, in your browser. Keeps full quality — no upload, no sign-up and no watermark.",
};

export default function HeicToJpgPage() {
  const content = TOOL_CONTENT["heic-to-jpg"];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteHeader />
      <h1 className="font-display text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">HEIC to JPG</h1>
      <p className="mt-2 max-w-3xl text-on-surface-variant">{content.lede}</p>
      <div className="mt-8">
        <HeicTool defaultTarget="jpeg" />
      </div>

      <ToolPageSections content={content} howTo="convert HEIC to JPG" />
      <SiteFooter />
    </div>
  );
}
