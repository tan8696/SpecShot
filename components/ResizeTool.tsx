"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { compressToQuality, formatFromMime, loadImageFile, type CompressFormat, type CompressResult } from "@/lib/engine/compress";
import { lockedDimension, dimensionsFromPercent, drawToSize } from "@/lib/engine/resize";
import { withWatermark } from "@/lib/engine/watermark";
import { downloadBlob } from "@/lib/download";
import { Notice } from "./Notice";
import { UploadScreen } from "./UploadScreen";
import { AdGate } from "./AdGate";

type Step = "upload" | "configure";
type Mode = "pixels" | "percent";

export function ResizeTool() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [format, setFormat] = useState<CompressFormat>("jpeg");
  const [mode, setMode] = useState<Mode>("pixels");
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [percent, setPercent] = useState(50);
  const [lockAspect, setLockAspect] = useState(true);
  const [result, setResult] = useState<CompressResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [showAdGate, setShowAdGate] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function onFile(f: File) {
    setError(null);
    setResult(null);
    try {
      const loaded = await loadImageFile(f);
      setFile(f);
      setImg(loaded);
      setFormat(formatFromMime(f.type));
      setWidth(loaded.naturalWidth);
      setHeight(loaded.naturalHeight);
      setMode("pixels");
      setStep("configure");
    } catch {
      setError("Could not read that image file.");
    }
  }

  function onWidthChange(next: number) {
    if (!img) return;
    if (lockAspect) {
      const d = lockedDimension(img.naturalWidth, img.naturalHeight, "width", next);
      setWidth(d.width);
      setHeight(d.height);
    } else {
      setWidth(next);
    }
  }

  function onHeightChange(next: number) {
    if (!img) return;
    if (lockAspect) {
      const d = lockedDimension(img.naturalWidth, img.naturalHeight, "height", next);
      setWidth(d.width);
      setHeight(d.height);
    } else {
      setHeight(next);
    }
  }

  // The actual pixel target for this render — percent mode always derives
  // from the source, so there's nothing to store separately for it.
  const targetW = img && mode === "percent" ? dimensionsFromPercent(img.naturalWidth, img.naturalHeight, percent).width : width;
  const targetH = img && mode === "percent" ? dimensionsFromPercent(img.naturalWidth, img.naturalHeight, percent).height : height;

  useEffect(() => {
    if (!img || targetW < 1 || targetH < 1) return;
    setUnlocked(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setProcessing(true);
      setError(null);
      try {
        const canvas = drawToSize(img, targetW, targetH);
        const r = await compressToQuality(canvas, format, 92);
        setResult(r);
      } catch {
        setError("Could not resize that image.");
      } finally {
        setProcessing(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [img, targetW, targetH, format]);

  useLayoutEffect(() => {
    if (!result || !canvasRef.current) return;
    let cancelled = false;
    const url = URL.createObjectURL(result.blob);
    const preview = new Image();
    preview.onload = () => {
      if (cancelled) {
        URL.revokeObjectURL(url);
        return;
      }
      const clean = document.createElement("canvas");
      clean.width = result.width;
      clean.height = result.height;
      clean.getContext("2d")!.drawImage(preview, 0, 0);

      const c = canvasRef.current!;
      c.width = result.width;
      c.height = result.height;
      c.getContext("2d")!.drawImage(unlocked ? clean : withWatermark(clean), 0, 0);
      URL.revokeObjectURL(url);
    };
    preview.src = url;
    return () => {
      cancelled = true;
    };
  }, [result, unlocked]);

  function onAdComplete() {
    if (!result || !file) return;
    setShowAdGate(false);
    setUnlocked(true);
    const ext = format === "jpeg" ? "jpg" : format;
    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    downloadBlob(result.blob, `${base}-resized.${ext}`);
  }

  function startOver() {
    setStep("upload");
    setFile(null);
    setImg(null);
    setResult(null);
    setUnlocked(false);
    setError(null);
  }

  if (step === "upload") {
    return (
      <>
        <UploadScreen
          onFile={onFile}
          heading="Resize an image"
          subheading="Change the dimensions by exact pixels or by percent — entirely in your browser."
          hint="Any JPEG, PNG, or WebP"
        />
        {error && <Notice tone="error">{error}</Notice>}
      </>
    );
  }

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
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Resize by
            </span>
            <div className="flex gap-1 rounded-md bg-slate-100 p-1 dark:bg-slate-950">
              {(["pixels", "percent"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded px-2 py-1 text-xs font-medium capitalize transition-colors ${
                    mode === m
                      ? "bg-indigo-500 text-white"
                      : "text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {mode === "pixels" ? (
            <>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label htmlFor="w" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                    Width
                  </label>
                  <input
                    id="w"
                    type="number"
                    min={1}
                    value={width}
                    onChange={(e) => onWidthChange(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
                <span className="mt-5 text-slate-400">×</span>
                <div className="flex-1">
                  <label htmlFor="h" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                    Height
                  </label>
                  <input
                    id="h"
                    type="number"
                    min={1}
                    value={height}
                    onChange={(e) => onHeightChange(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <input type="checkbox" checked={lockAspect} onChange={(e) => setLockAspect(e.target.checked)} className="accent-indigo-500" />
                Lock aspect ratio
              </label>
            </>
          ) : (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="pct" className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Scale
                </label>
                <span className="font-mono text-xs text-slate-500">{percent}%</span>
              </div>
              <input
                id="pct"
                type="range"
                min={1}
                max={200}
                value={percent}
                onChange={(e) => setPercent(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          )}
        </div>

        {error && <Notice tone="error">{error}</Notice>}
      </aside>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_260px]">
          <div className="flex items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <canvas ref={canvasRef} role="img" aria-label="Preview of the resized image" className="h-auto max-h-[70vh] w-full object-contain" />
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Result</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-600 dark:text-slate-400">Original</dt>
                  <dd className="font-mono text-slate-900 dark:text-slate-100">
                    {img ? `${img.naturalWidth}×${img.naturalHeight}` : "…"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600 dark:text-slate-400">New size</dt>
                  <dd className="font-mono text-slate-900 dark:text-slate-100">{result ? `${result.width}×${result.height}` : "…"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600 dark:text-slate-400">File size</dt>
                  <dd className="font-mono text-slate-900 dark:text-slate-100">
                    {result ? `${(result.blob.size / 1024).toFixed(1)}KB` : "…"}
                  </dd>
                </div>
              </dl>
            </div>

            <button
              onClick={() => (unlocked ? onAdComplete() : setShowAdGate(true))}
              disabled={!result || processing}
              className="w-full rounded-md bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing ? "Resizing…" : unlocked ? "Download again" : "Watch ad to download — free"}
            </button>
          </div>
        </div>
      </div>

      {showAdGate && <AdGate onComplete={onAdComplete} onCancel={() => setShowAdGate(false)} />}
    </div>
  );
}
