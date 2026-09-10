/** Images <-> PDF. pdf-lib (writer) and pdfjs-dist (reader) are both
 * dynamically imported so their weight only lands when a PDF tool is used.
 * Pure geometry (fitContain, renderScaleForPage) is split out and unit
 * tested, matching the rest of lib/engine. */
import { canvasToBlob } from "./encode";

export type PageMode = "image" | "a4" | "letter";

// PDF points at 72dpi.
const PAGE_SIZES: Record<Exclude<PageMode, "image">, { w: number; h: number }> = {
  a4: { w: 595, h: 842 },
  letter: { w: 612, h: 792 },
};
const PAGE_MARGIN_PT = 36; // 0.5in

/** Scale src to fit inside box (minus a uniform margin) preserving aspect,
 * then centre it. Returns the placement rect. Pure. */
export function fitContain(
  srcW: number,
  srcH: number,
  boxW: number,
  boxH: number,
  margin = 0
): { x: number; y: number; w: number; h: number } {
  const availW = Math.max(1, boxW - margin * 2);
  const availH = Math.max(1, boxH - margin * 2);
  const scale = Math.min(availW / srcW, availH / srcH, 1);
  const w = srcW * scale;
  const h = srcH * scale;
  return { x: (boxW - w) / 2, y: (boxH - h) / 2, w, h };
}

/** Render scale for a PDF page so its long side lands near targetLongPx,
 * clamped so tiny pages aren't blown up absurdly and huge ones don't blow
 * past canvas limits. Pure. */
export function renderScaleForPage(pageWidthPt: number, pageHeightPt: number, targetLongPx: number): number {
  const longPt = Math.max(pageWidthPt, pageHeightPt);
  return Math.min(6, Math.max(0.5, targetLongPx / longPt));
}

async function toEmbeddable(file: File): Promise<{ bytes: Uint8Array; kind: "jpg" | "png" }> {
  if (file.type === "image/jpeg") return { bytes: new Uint8Array(await file.arrayBuffer()), kind: "jpg" };
  if (file.type === "image/png") return { bytes: new Uint8Array(await file.arrayBuffer()), kind: "png" };
  // Anything else (webp, gif, ...) — rasterise to PNG via a canvas first.
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not read an image"));
    el.src = URL.createObjectURL(file);
  });
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext("2d")!.drawImage(img, 0, 0);
  const blob = await canvasToBlob(canvas, "image/png");
  return { bytes: new Uint8Array(await blob.arrayBuffer()), kind: "png" };
}

/** One image per page, in the given order. */
export async function imagesToPdf(files: File[], mode: PageMode): Promise<Blob> {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.create();

  for (const file of files) {
    const { bytes, kind } = await toEmbeddable(file);
    const embedded = kind === "jpg" ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);

    if (mode === "image") {
      const page = doc.addPage([embedded.width, embedded.height]);
      page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
    } else {
      const { w: pw, h: ph } = PAGE_SIZES[mode];
      const page = doc.addPage([pw, ph]);
      const rect = fitContain(embedded.width, embedded.height, pw, ph, PAGE_MARGIN_PT);
      page.drawImage(embedded, rect);
    }
  }

  const out = await doc.save();
  return new Blob([out as BlobPart], { type: "application/pdf" });
}

/** Every page of the PDF rendered to a canvas, on a white background (so
 * both JPG and PNG output look like paper, and JPEG's lack of alpha is a
 * non-issue). The caller encodes each canvas to the format the user picks —
 * cheap, so format/quality changes don't re-run the expensive pdfjs render. */
export async function pdfToCanvases(
  file: File,
  onProgress?: (page: number, total: number) => void
): Promise<HTMLCanvasElement[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;
  const out: HTMLCanvasElement[] = [];
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      onProgress?.(i, doc.numPages);
      const page = await doc.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: renderScaleForPage(base.width, base.height, 1600) });

      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      out.push(canvas);
      page.cleanup();
    }
  } finally {
    await loadingTask.destroy();
  }
  return out;
}
