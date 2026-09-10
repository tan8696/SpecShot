"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { pdfToCanvases } from "@/lib/engine/pdf";
import { canvasToBlob } from "@/lib/engine/encode";
import { withWatermark } from "@/lib/engine/watermark";
import { downloadBlob } from "@/lib/download";
import { Notice } from "./Notice";
import { UploadScreen } from "./UploadScreen";
import { AdGate } from "./AdGate";

type Step = "upload" | "rendering" | "configure";
type Format = "jpeg" | "png";
const LABELS: Record<Format, string> = { jpeg: "JPG", png: "PNG" };

const encode = (canvas: HTMLCanvasElement, format: Format, quality: number) =>
  canvasToBlob(canvas, `image/${format}`, format === "png" ? undefined : quality / 100);

/** One PDF -> a raster image per page. Renders every page once (pdfjs, the
 * expensive step), then encodes on demand so format/quality changes are
 * instant. One ad unlocks every page at the chosen format. */
export function PdfToImageTool({ defaultFormat = "jpeg" }: { defaultFormat?: Format }) {
  const [step, setStep] = useState<Step>("upload");
  const [name, setName] = useState("page");
  const [canvases, setCanvases] = useState<HTMLCanvasElement[]>([]);
  const [pageIdx, setPageIdx] = useState(0);
  const [format, setFormat] = useState<Format>(defaultFormat);
  const [quality, setQuality] = useState(92);
  const [progress, setProgress] = useState<{ page: number; total: number } | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [showAdGate, setShowAdGate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function onFile(f: File) {
    setError(null);
    if (f.type !== "application/pdf" && !/\.pdf$/i.test(f.name)) {
      setError("That doesn't look like a PDF file.");
      return;
    }
    setName(f.name.replace(/\.[^.]+$/, "") || "page");
    setStep("rendering");
    setProgress({ page: 0, total: 0 });
    try {
      const rendered = await pdfToCanvases(f, (page, total) => setProgress({ page, total }));
      setCanvases(rendered);
      setPageIdx(0);
      setFormat(defaultFormat);
      setStep("configure");
    } catch {
      setError("Could not read that PDF — it may be corrupt or password-protected.");
      setStep("upload");
    }
  }

  // Re-encode the visible page whenever it, the format, or the quality
  // changes. Only format/quality re-locks the download — flipping pages is
  // still the same paid-for output.
  useEffect(() => {
    if (canvases.length === 0) return;
    let cancelled = false;
    encode(canvases[pageIdx], format, quality).then((b) => {
      if (!cancelled) setBlob(b);
    });
    return () => {
      cancelled = true;
    };
  }, [canvases, pageIdx, format, quality]);

  useEffect(() => {
    setUnlocked(false);
  }, [format, quality]);

  useLayoutEffect(() => {
    if (!blob || !canvasRef.current) return;
    let cancelled = false;
    const url = URL.createObjectURL(blob);
    const preview = new Image();
    preview.onload = () => {
      if (cancelled) {
        URL.revokeObjectURL(url);
        return;
      }
      const clean = document.createElement("canvas");
      clean.width = preview.width;
      clean.height = preview.height;
      clean.getContext("2d")!.drawImage(preview, 0, 0);
      const c = canvasRef.current!;
      c.width = preview.width;
      c.height = preview.height;
      c.getContext("2d")!.drawImage(unlocked ? clean : withWatermark(clean), 0, 0);
      URL.revokeObjectURL(url);
    };
    preview.src = url;
    return () => {
      cancelled = true;
    };
  }, [blob, unlocked]);

  const ext = format === "jpeg" ? "jpg" : "png";
  const multi = canvases.length > 1;

  function downloadPage(i: number) {
    encode(canvases[i], format, quality).then((b) => downloadBlob(b, multi ? `${name}-page-${i + 1}.${ext}` : `${name}.${ext}`));
  }

  async function downloadAll() {
    setBusy(true);
    try {
      for (let i = 0; i < canvases.length; i++) {
        const b = await encode(canvases[i], format, quality);
        downloadBlob(b, `${name}-page-${i + 1}.${ext}`);
        await new Promise((r) => setTimeout(r, 150));
      }
    } finally {
      setBusy(false);
    }
  }

  function onAdComplete() {
    setShowAdGate(false);
    setUnlocked(true);
    downloadPage(pageIdx);
  }

  function startOver() {
    setStep("upload");
    setCanvases([]);
    setBlob(null);
    setUnlocked(false);
    setError(null);
  }

  if (step === "upload") {
    return (
      <>
        <UploadScreen
          onFile={onFile}
          heading="PDF to images"
          subheading="Turn every page of a PDF into a JPG or PNG — entirely in your browser."
          hint="A .pdf file"
          accept="application/pdf,.pdf"
          selectLabel="Select a PDF"
        />
        {error && <Notice tone="error">{error}</Notice>}
      </>
    );
  }

  if (step === "rendering") {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Rendering{progress && progress.total ? ` page ${progress.page} of ${progress.total}` : ""}… (the PDF engine loads the first time)
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4">
        <button
          onClick={startOver}
          className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          ← Choose a different file
        </button>

        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Format</span>
            <div className="flex gap-1 rounded-md bg-slate-100 p-1 dark:bg-slate-950">
              {(["jpeg", "png"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                    format === f ? "bg-indigo-500 text-white" : "text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          {format === "jpeg" && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="pdfQuality" className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Quality
                </label>
                <span className="font-mono text-xs text-slate-500">{quality}%</span>
              </div>
              <input id="pdfQuality" type="range" min={1} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full accent-indigo-500" />
            </div>
          )}

          {multi && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPageIdx((i) => Math.max(0, i - 1))}
                disabled={pageIdx === 0}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-40 dark:border-slate-700"
              >
                ← Prev
              </button>
              <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                Page {pageIdx + 1} / {canvases.length}
              </span>
              <button
                onClick={() => setPageIdx((i) => Math.min(canvases.length - 1, i + 1))}
                disabled={pageIdx === canvases.length - 1}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-40 dark:border-slate-700"
              >
                Next →
              </button>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">This page</span>
            <span className="font-mono text-slate-900 dark:text-slate-100">
              {blob ? `${canvases[pageIdx].width}×${canvases[pageIdx].height}, ${(blob.size / 1024).toFixed(0)}KB` : "…"}
            </span>
          </div>

          <button
            onClick={() => (unlocked ? downloadPage(pageIdx) : setShowAdGate(true))}
            disabled={!blob}
            className="w-full rounded-md bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {unlocked ? `Download page ${pageIdx + 1}` : "Watch ad to download — free"}
          </button>
          {unlocked && multi && (
            <button
              onClick={downloadAll}
              disabled={busy}
              className="w-full rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-200 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              {busy ? "Downloading…" : `Download all ${canvases.length} pages`}
            </button>
          )}
        </div>

        {error && <Notice tone="error">{error}</Notice>}
      </aside>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <canvas ref={canvasRef} role="img" aria-label={`Preview of page ${pageIdx + 1}`} className="h-auto max-h-[75vh] w-full object-contain" />
      </div>

      {showAdGate && <AdGate onComplete={onAdComplete} onCancel={() => setShowAdGate(false)} />}
    </div>
  );
}
