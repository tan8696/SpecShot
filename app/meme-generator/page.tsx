import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolPageSections } from "@/components/ToolPageSections";
import { TOOL_CONTENT } from "@/lib/toolContent";
import { MemeTool } from "@/components/MemeTool";

export const metadata: Metadata = {
  alternates: { canonical: "/meme-generator/" },
  title: "Meme Generator — Free, No Watermark | SpecShot",
  description: "Make a meme from any image: add classic top and bottom captions and download free with no watermark. Runs in your browser, nothing uploaded.",
};

export default function MemeGeneratorPage() {
  const content = TOOL_CONTENT["meme-generator"];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteHeader />
      <h1 className="font-display text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">Meme Generator</h1>
      <p className="mt-2 max-w-3xl text-on-surface-variant">{content.lede}</p>
      <div className="mt-8">
        <MemeTool />
      </div>

      <ToolPageSections content={content} howTo="make a meme" />
      <SiteFooter />
    </div>
  );
}
