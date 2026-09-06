"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  loadImageFile,
  drawResized,
  compressToQuality,
  compressToTargetKb,
  formatFromMime,
  type CompressFormat,
  type CompressResult,
} from "@/lib/engine/compress";
import { withWatermark } from "@/lib/engine/watermark";
import { downloadBlob } from "@/lib/download";
import { Notice } from "./Notice";
import { UploadScreen } from "./UploadScreen";
import { AdGate } from "./AdGate";

type SizeMode = "quality" | "target";
type Step = "upload" | "configure";

const FORMATS: CompressFormat[] = ["jpeg", "png", "webp"];

export function CompressTool() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [format, setFormat] = useState<CompressFormat>("jpeg");
  const [sizeMode, setSizeMode] = useState<SizeMode>("quality");
  const [quality, setQuality] = useState(80);
  const [targetKb, setTargetKb] = useState(200);
  const [resizeEnabled, setResizeEnabled] = useState(false);
  const [maxDim, setMaxDim] = useState(1920);
  const [result, setResult] = useState<CompressResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [showAdGate, setShowAdGate] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // PNG has no quality knob, so a size target is meaningless for it.
  useEffect(() => {
    if (format === "png" && sizeMode === "target") setSizeMode("quality");
  }, [format, sizeMode]);

  async function onFile(f: File) {
    setError(null);
    setResult(null);
    try {
      const loaded = await loadImageFile(f);
      setFile(f);
      setImg(loaded);
      setFormat(formatFromMime(f.type));
      setStep("configure");
    } catch {
      setError("Could not read that image file.");
    }
  }

  // Recompresses whenever any control changes. Debounced so dragging the
  // quality slider doesn't re-encode on every intermediate value. Any
  // settings change re-locks the download — a previously-watched ad only
  // covers the output it unlocked, not whatever you tweak it into next.
  useEffect(() => {
    if (!img) return;
    setUnlocked(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setProcessing(true);
      setError(null);
      try {
        const canvas = drawResized(img, resizeEnabled ? maxDim : undefined);
        const r =
          sizeMode === "quality"
            ? await compressToQuality(canvas, format, quality)
            : await compressToTargetKb(canvas, format, targetKb);
        setResult(r);
      } catch {
        setError("Could not compress that image.");
      } finally {
        setProcessing(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [img, format, sizeMode, quality, targetKb, resizeEnabled, maxDim]);

  // Draws the live result — watermarked until this exact output has been
  // unlocked with an ad, otherwise the canvas could just be right-click-saved
  // and the ad gate would be pointless.
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
    downloadBlob(result.blob, `${base}-compressed.${ext}`);
  }

  function startOver() {
    setStep("upload");
    setFile(null);
    setImg(null);
    setResult(null);
    setUnlocked(false);
    setError(null);
  }

  const originalKb = file ? file.size / 1024 : 0;
  const resultKb = result ? result.blob.size / 1024 : 0;
  const reduction = file && result ? Math.round((1 - result.blob.size / file.size) * 100) : 0;

  if (step === "upload") {
    return (
      <>
        <UploadScreen
          onFile={onFile}
          heading="Compress your photo"
          subheading="Reduce file size or hit an exact KB target — no upload, it happens right in your browser."
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
              Format
            </span>
            <div className="flex gap-1 rounded-md bg-slate-100 p-1 dark:bg-slate-950">
              {FORMATS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 rounded px-2 py-1 text-xs font-medium uppercase transition-colors ${
                    format === f
                      ? "bg-indigo-500 text-white"
                      : "text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Compress by
            </span>
            <div className="flex gap-1 rounded-md bg-slate-100 p-1 dark:bg-slate-950">
              <button
                onClick={() => setSizeMode("quality")}
                className={`flex-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                  sizeMode === "quality"
                    ? "bg-indigo-500 text-white"
                    : "text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                Quality
              </button>
              <button
                onClick={() => setSizeMode("target")}
                disabled={format === "png"}
                className={`flex-1 rounded px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  sizeMode === "target"
                    ? "bg-indigo-500 text-white"
                    : "text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                Target size
              </button>
            </div>
          </div>

          {sizeMode === "quality" ? (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label
                  htmlFor="quality"
                  className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400"
                >
                  Quality
                </label>
                <span className="font-mono text-xs text-slate-500">{quality}%</span>
              </div>
              <input
                id="quality"
                type="range"
                min={1}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                disabled={format === "png"}
                className="w-full accent-indigo-500 disabled:opacity-50"
              />
              {format === "png" && <p className="mt-1 text-xs text-slate-500">PNG is lossless — no quality knob.</p>}
            </div>
          ) : (
            <div>
              <label
                htmlFor="targetKb"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400"
              >
                Target size (KB)
              </label>
              <input
                id="targetKb"
                type="number"
                min={5}
                value={targetKb}
                onChange={(e) => setTargetKb(Math.max(5, Number(e.target.value) || 5))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={resizeEnabled}
                onChange={(e) => setResizeEnabled(e.target.checked)}
                className="accent-indigo-500"
              />
              Resize
            </label>
            {resizeEnabled && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={16}
                  value={maxDim}
                  onChange={(e) => setMaxDim(Math.max(16, Number(e.target.value) || 16))}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                <span className="shrink-0 text-xs text-slate-500">px, longest side</span>
              </div>
            )}
          </div>
        </div>

        {error && <Notice tone="error">{error}</Notice>}
      </aside>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_260px]">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <canvas
              ref={canvasRef}
              role="img"
              aria-label="Preview of the compressed image"
              className="h-auto w-full"
            />
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Result</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-600 dark:text-slate-400">Original</dt>
                  <dd className="font-mono text-slate-900 dark:text-slate-100">{formatKb(originalKb)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600 dark:text-slate-400">Compressed</dt>
                  <dd className="font-mono text-slate-900 dark:text-slate-100">
                    {result ? formatKb(resultKb) : "…"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600 dark:text-slate-400">Dimensions</dt>
                  <dd className="font-mono text-slate-900 dark:text-slate-100">
                    {result ? `${result.width}×${result.height}` : "…"}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 dark:border-slate-800">
                  <dt className="font-medium text-slate-700 dark:text-slate-300">Reduction</dt>
                  <dd
                    className={`font-mono font-bold ${
                      reduction >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {result ? (reduction >= 0 ? `-${reduction}%` : `+${-reduction}%`) : "…"}
                  </dd>
                </div>
              </dl>
            </div>

            <button
              onClick={() => (unlocked ? onAdComplete() : setShowAdGate(true))}
              disabled={!result || processing}
              className="w-full rounded-md bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing ? "Compressing…" : unlocked ? "Download again" : "Watch ad to download — free"}
            </button>
          </div>
        </div>
      </div>

      {showAdGate && <AdGate onComplete={onAdComplete} onCancel={() => setShowAdGate(false)} />}
    </div>
  );
}

function formatKb(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(0)} KB`;
}
