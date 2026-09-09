"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { loadImageFile, drawResized, compressToQuality, formatFromMime, type CompressFormat } from "@/lib/engine/compress";
import { rotateCanvas, flipCanvas, type Rotation } from "@/lib/engine/rotate";
import { withWatermark } from "@/lib/engine/watermark";
import { downloadBlob } from "@/lib/download";
import { Notice } from "./Notice";
import { UploadScreen } from "./UploadScreen";
import { AdGate } from "./AdGate";

type Step = "upload" | "configure";

// No pure math to extract for 90°-increment rotate/flip (see lib/engine/rotate.ts) —
// re-encoding at a fixed high quality is the only "processing" step, so this
// tool applies transforms straight to a working canvas rather than
// recomputing from the original on every click.
const OUTPUT_QUALITY = 95;

export function RotateTool() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<CompressFormat>("jpeg");
  const [working, setWorking] = useState<HTMLCanvasElement | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [showAdGate, setShowAdGate] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function onFile(f: File) {
    setError(null);
    try {
      const img = await loadImageFile(f);
      setFile(f);
      setFormat(formatFromMime(f.type));
      setWorking(drawResized(img));
      setStep("configure");
    } catch {
      setError("Could not read that image file.");
    }
  }

  function apply(next: HTMLCanvasElement) {
    setWorking(next);
    setUnlocked(false);
  }

  useLayoutEffect(() => {
    if (!working) return;
    let cancelled = false;
    setProcessing(true);
    setError(null);
    compressToQuality(working, format, OUTPUT_QUALITY)
      .then((r) => {
        if (!cancelled) setBlob(r.blob);
      })
      .catch(() => {
        if (!cancelled) setError("Could not process that image.");
      })
      .finally(() => {
        if (!cancelled) setProcessing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [working, format]);

  useLayoutEffect(() => {
    if (!working || !canvasRef.current) return;
    const c = canvasRef.current;
    c.width = working.width;
    c.height = working.height;
    c.getContext("2d")!.drawImage(unlocked ? working : withWatermark(working), 0, 0);
  }, [working, unlocked]);

  function onAdComplete() {
    if (!blob || !file) return;
    setShowAdGate(false);
    setUnlocked(true);
    const ext = format === "jpeg" ? "jpg" : format;
    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    downloadBlob(blob, `${base}-rotated.${ext}`);
  }

  function startOver() {
    setStep("upload");
    setFile(null);
    setWorking(null);
    setBlob(null);
    setUnlocked(false);
    setError(null);
  }

  if (step === "upload") {
    return (
      <>
        <UploadScreen
          onFile={onFile}
          heading="Rotate an image"
          subheading="Rotate in 90° steps or flip horizontally/vertically — entirely in your browser."
          hint="Any JPEG, PNG, or WebP"
        />
        {error && <Notice tone="error">{error}</Notice>}
      </>
    );
  }

  const rotateBtn = (label: string, degrees: Rotation) => (
    <button
      key={label}
      onClick={() => working && apply(rotateCanvas(working, degrees))}
      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {label}
    </button>
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4">
        <button
          onClick={startOver}
          className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          ← Choose a different photo
        </button>

        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Rotate
            </span>
            <div className="grid grid-cols-3 gap-2">
              {rotateBtn("↺ 90°", 270)}
              {rotateBtn("180°", 180)}
              {rotateBtn("90° ↻", 90)}
            </div>
          </div>
          <div>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Flip
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => working && apply(flipCanvas(working, "horizontal"))}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                ⇋ Horizontal
              </button>
              <button
                onClick={() => working && apply(flipCanvas(working, "vertical"))}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                ⇵ Vertical
              </button>
            </div>
          </div>
        </div>

        {error && <Notice tone="error">{error}</Notice>}
      </aside>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_260px]">
          <div className="flex items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <canvas ref={canvasRef} role="img" aria-label="Preview of the rotated image" className="h-auto max-h-[70vh] w-full object-contain" />
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Result</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-600 dark:text-slate-400">Dimensions</dt>
                  <dd className="font-mono text-slate-900 dark:text-slate-100">
                    {working ? `${working.width}×${working.height}` : "…"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600 dark:text-slate-400">File size</dt>
                  <dd className="font-mono text-slate-900 dark:text-slate-100">
                    {blob ? `${(blob.size / 1024).toFixed(1)}KB` : "…"}
                  </dd>
                </div>
              </dl>
            </div>

            <button
              onClick={() => (unlocked ? onAdComplete() : setShowAdGate(true))}
              disabled={!blob || processing}
              className="w-full rounded-md bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing ? "Processing…" : unlocked ? "Download again" : "Watch ad to download — free"}
            </button>
          </div>
        </div>
      </div>

      {showAdGate && <AdGate onComplete={onAdComplete} onCancel={() => setShowAdGate(false)} />}
    </div>
  );
}
