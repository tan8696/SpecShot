"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { pdfToCanvases } from "@/lib/engine/pdf";
import { canvasToBlob } from "@/lib/engine/encode";
import { withWatermark } from "@/lib/engine/watermark";
import { downloadBlob } from "@/lib/download";
import { Notice } from "./Notice";
import { UploadScreen } from "./UploadScreen";
import { AdGate } from "./AdGate";
import { StatPill, StudioPrivacyNote, formatKb, STUDIO_FRAME } from "./studioUi";

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
      <div className="rounded-2xl bg-surface-container-lowest p-10 text-center font-body text-on-surface">
        <span className="material-symbols-outlined animate-spin text-[28px] text-primary">progress_activity</span>
        <p className="mt-3 text-sm text-on-surface-variant">
          Rendering{progress && progress.total ? ` page ${progress.page} of ${progress.total}` : ""}… the PDF engine loads the first time.
        </p>
      </div>
    );
  }

  const btn =
    "flex items-center justify-center gap-1 rounded-lg bg-surface-container px-2 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-40";
  const pageDims = blob ? `${canvases[pageIdx].width} × ${canvases[pageIdx].height}` : "…";

  return (
    <div className={STUDIO_FRAME}>
      <button onClick={startOver} className="text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface">
        ← Choose a different file
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">auto_stories</span>
          <h2 className="font-display text-base font-semibold">PDF → Images</h2>
          <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[11px] text-secondary">
            {canvases.length} {canvases.length === 1 ? "page" : "pages"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatPill icon="crop_free" label="Page" value={pageDims} tone="primary" />
          <StatPill icon="download" label="This page" value={blob ? formatKb(blob.size / 1024) : "—"} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="overflow-hidden rounded-xl bg-black">
            <div className="flex items-center justify-between bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
              <span className="truncate">{name}</span>
              <span className="shrink-0 font-mono text-outline">page {pageIdx + 1} / {canvases.length}</span>
            </div>
            <div className="flex items-center justify-center p-3">
              <canvas ref={canvasRef} role="img" aria-label={`Preview of page ${pageIdx + 1}`} className="max-h-[62vh] max-w-full object-contain" />
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <div className="space-y-4 rounded-xl bg-surface-container-low p-4">
            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-outline">Format</span>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-container-lowest p-1">
                {(["jpeg", "png"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                      format === f ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:text-on-surface"
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
                  <label htmlFor="pdfQuality" className="text-xs font-medium text-on-surface">Quality</label>
                  <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[11px] text-secondary">{quality}%</span>
                </div>
                <input id="pdfQuality" type="range" min={1} max={100} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full accent-primary" />
              </div>
            )}

            {multi && (
              <div className="flex items-center justify-between gap-2">
                <button className={btn} onClick={() => setPageIdx((i) => Math.max(0, i - 1))} disabled={pageIdx === 0}>
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>Prev
                </button>
                <span className="font-mono text-xs text-on-surface-variant">{pageIdx + 1} / {canvases.length}</span>
                <button className={btn} onClick={() => setPageIdx((i) => Math.min(canvases.length - 1, i + 1))} disabled={pageIdx === canvases.length - 1}>
                  Next<span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <button
              onClick={() => (unlocked ? downloadPage(pageIdx) : setShowAdGate(true))}
              disabled={!blob}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-[0_0_20px_-4px_rgba(192,193,255,0.5)] transition-colors hover:bg-primary-container hover:text-on-primary-container disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              {unlocked ? `Download page ${pageIdx + 1}` : "Watch ad to download — free"}
            </button>
            {unlocked && multi && (
              <button onClick={downloadAll} disabled={busy} className={`${btn} w-full`}>
                <span className="material-symbols-outlined text-[16px]">download_for_offline</span>
                {busy ? "Downloading…" : `Download all ${canvases.length} pages`}
              </button>
            )}
          </div>
        </div>
      </div>

      <StudioPrivacyNote />
      {error && <Notice tone="error">{error}</Notice>}
      {showAdGate && <AdGate onComplete={onAdComplete} onCancel={() => setShowAdGate(false)} />}
    </div>
  );
}
