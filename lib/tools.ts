/** Single source of truth for every tool's nav entry + route — read by
 * ToolNav, the /tools index page, the landing-page grid, and sitemap.ts, so a
 * new tool only needs adding here once. Static data, not fetched (unlike
 * specs/*.json, there's no per-tool human-verification gate to justify a
 * file-per-entry). */
export type ToolCategory = "optimize" | "transform" | "create" | "document";

export type ToolEntry = {
  id: string;
  label: string;
  description: string;
  href: string;
  /** Material Symbols Outlined ligature name, for the landing-page grid. */
  icon: string;
  category: ToolCategory;
  primary?: boolean; // shown directly in the nav row, not under "More tools"
};

/** One hue per category — the only colour in an otherwise monochrome UI, so
 * it always means "these tools do the same kind of job". Full class strings
 * rather than a hue name because Tailwind scans source for literal classes. */
export const CATEGORY_ACCENT: Record<
  ToolCategory,
  { text: string; hoverText: string; bg: string; border: string; dot: string }
> = {
  optimize: { text: "text-accent-teal", hoverText: "group-hover:text-accent-teal", bg: "bg-accent-teal/12", border: "hover:border-accent-teal/50", dot: "bg-accent-teal" },
  transform: { text: "text-accent-amber", hoverText: "group-hover:text-accent-amber", bg: "bg-accent-amber/12", border: "hover:border-accent-amber/50", dot: "bg-accent-amber" },
  create: { text: "text-accent-coral", hoverText: "group-hover:text-accent-coral", bg: "bg-accent-coral/12", border: "hover:border-accent-coral/50", dot: "bg-accent-coral" },
  document: { text: "text-accent-sky", hoverText: "group-hover:text-accent-sky", bg: "bg-accent-sky/12", border: "hover:border-accent-sky/50", dot: "bg-accent-sky" },
};

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  optimize: "Optimize",
  transform: "Transform",
  create: "Create",
  document: "Documents",
};

export const TOOLS: ToolEntry[] = [
  { id: "resize", label: "Resize", description: "Change an image's dimensions by pixels or percent.", href: "/resize-image/", icon: "aspect_ratio", category: "transform", primary: true },
  { id: "upscale", label: "Upscale", description: "Enlarge a photo 2–4× and sharpen it back up.", href: "/upscale-image/", icon: "hd", category: "transform", primary: true },
  { id: "crop", label: "Crop", description: "Drag a selection rectangle to crop any photo.", href: "/crop-image/", icon: "crop", category: "transform", primary: true },
  { id: "editor", label: "Photo Editor", description: "Light, colour, filters, border, caption, rotate.", href: "/photo-editor/", icon: "tune", category: "create", primary: true },
  { id: "compress", label: "Compress", description: "Shrink a photo's file size, by quality or an exact KB target.", href: "/app/", icon: "compress", category: "optimize", primary: true },
  { id: "rotate", label: "Rotate", description: "Rotate in 90° steps or flip horizontally / vertically.", href: "/rotate-image/", icon: "rotate_90_degrees_cw", category: "transform" },
  { id: "convert", label: "Convert", description: "Convert between JPG, PNG, and WebP.", href: "/convert-image/", icon: "sync_alt", category: "optimize" },
  { id: "watermark", label: "Watermark", description: "Stamp your own text or logo onto a photo.", href: "/watermark-image/", icon: "branding_watermark", category: "create" },
  { id: "meme", label: "Meme Generator", description: "Add top and bottom captions to any image.", href: "/meme-generator/", icon: "sentiment_very_satisfied", category: "create" },
  { id: "heic", label: "HEIC → JPG", description: "Convert an iPhone HEIC/HEIF photo to JPG or PNG.", href: "/heic-to-jpg/", icon: "phone_iphone", category: "document" },
  { id: "jpg-to-pdf", label: "JPG → PDF", description: "Combine several images into one PDF, a page each.", href: "/jpg-to-pdf/", icon: "picture_as_pdf", category: "document" },
  { id: "pdf-to-jpg", label: "PDF → JPG", description: "Turn every page of a PDF into a JPG or PNG.", href: "/pdf-to-jpg/", icon: "auto_stories", category: "document" },
  { id: "signature", label: "Signature", description: "Clean up a photographed signature for a form upload.", href: "/app/?tool=signature", icon: "draw", category: "document" },
];
