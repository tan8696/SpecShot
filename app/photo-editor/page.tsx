import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolPageSections } from "@/components/ToolPageSections";
import { TOOL_CONTENT } from "@/lib/toolContent";
import { PhotoEditorTool } from "@/components/PhotoEditorTool";

export const metadata: Metadata = {
  title: "Photo Editor — Free Online Image Editor, No Upload — SpecShot",
  description: "Adjust brightness, contrast and colour, apply filters, add a border or caption, rotate and flip. Runs entirely in your browser.",
};

export default function PhotoEditorPage() {
  const content = TOOL_CONTENT["photo-editor"];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <SiteHeader />
      <h1 className="font-display text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">Photo Editor</h1>
      <p className="mt-2 max-w-3xl text-on-surface-variant">{content.lede}</p>
      <div className="mt-8">
        <PhotoEditorTool />
      </div>

      <ToolPageSections content={content} howTo="edit a photo" />
      <SiteFooter />
    </div>
  );
}
