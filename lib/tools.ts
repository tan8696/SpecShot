/** Single source of truth for every tool's nav entry + route — read by
 * ToolNav, the /tools index page, and sitemap.ts, so a new tool only needs
 * adding here once. Static data, not fetched (unlike specs/*.json, there's
 * no per-tool human-verification gate to justify a file-per-entry). */
export type ToolEntry = {
  id: string;
  label: string;
  description: string;
  href: string;
  primary?: boolean; // shown directly in the nav row, not under "More tools"
};

export const TOOLS: ToolEntry[] = [
  { id: "id-photo", label: "ID Photo", description: "Crop a selfie to an exact government spec.", href: "/", primary: true },
  { id: "resize", label: "Resize", description: "Change an image's dimensions by pixels or percent.", href: "/resize-image/", primary: true },
  { id: "crop", label: "Crop", description: "Drag a selection rectangle to crop any photo.", href: "/crop-image/", primary: true },
  { id: "editor", label: "Photo Editor", description: "Light, colour, filters, border, caption, rotate.", href: "/photo-editor/", primary: true },
  { id: "compress", label: "Compress", description: "Shrink a photo's file size, by quality or an exact KB target.", href: "/?tool=compress" },
  { id: "rotate", label: "Rotate", description: "Rotate or flip an image.", href: "/rotate-image/" },
  { id: "convert", label: "Convert", description: "Convert between JPG, PNG, and WebP.", href: "/convert-image/" },
  { id: "watermark", label: "Watermark", description: "Stamp your own text or logo onto a photo.", href: "/watermark-image/" },
  { id: "meme", label: "Meme Generator", description: "Add top and bottom captions to any image.", href: "/meme-generator/" },
  { id: "heic", label: "HEIC → JPG", description: "Convert an iPhone HEIC/HEIF photo to JPG or PNG.", href: "/heic-to-jpg/" },
  { id: "jpg-to-pdf", label: "JPG → PDF", description: "Combine several images into one PDF, a page each.", href: "/jpg-to-pdf/" },
  { id: "pdf-to-jpg", label: "PDF → JPG", description: "Turn every page of a PDF into a JPG or PNG.", href: "/pdf-to-jpg/" },
  { id: "signature", label: "Signature", description: "Clean up a photographed signature for a form upload.", href: "/?tool=signature" },
];
