"use client";

import { useEffect, useRef, useState } from "react";
import {
  compressToQuality,
  formatFromMime,
  loadImageFile,
  type CompressFormat,
  type CompressResult,
} from "@/lib/engine/compress";
import { lockedDimension, dimensionsFromPercent, drawToSize } from "@/lib/engine/resize";
import { withWatermark } from "@/lib/engine/watermark";
import { downloadBlob } from "@/lib/download";
import { Notice } from "./Notice";
import { UploadScreen } from "./UploadScreen";
import { AdGate } from "./AdGate";
import { StatPill, formatKb, STUDIO_FRAME } from "./studioUi";

type Step = "upload" | "configure";
type Mode = "pixels" | "percent";

const FORMATS: CompressFormat[] = ["jpeg", "png", "webp"];
const PRESETS = [25, 50, 75, 100, 150, 200];

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
  const [encodeMs, setEncodeMs] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [showAdGate, setShowAdGate] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
      setPercent(50);
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

  // Percent mode always derives from the source, so nothing extra to store.
  const targetW = img && mode === "percent" ? dimensionsFromPercent(img.naturalWidth, img.naturalHeight, percent).width : width;
  const targetH = img && mode === "percent" ? dimensionsFromPercent(img.naturalWidth, img.naturalHeight, percent).height : height;
  const scalePct = img ? Math.round((targetW / img.naturalWidth) * 100) : 100;
  const upscaling = img ? targetW > img.naturalWidth || targetH > img.naturalHeight : false;

  // Re-render whenever the target size or format changes. Debounced; any
  // change re-locks the download (a watched ad only covers the exact output
  // it unlocked).
  useEffect(() => {
    if (!img || targetW < 1 || targetH < 1) return;
    setUnlocked(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setProcessing(true);
      setError(null);
      try {
        const canvas = drawToSize(img, targetW, targetH);
        const t0 = performance.now();
        const r = await compressToQuality(canvas, format, 92);
        setEncodeMs(Math.round(performance.now() - t0));
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

  // Preview — watermarked until this exact output has been unlocked with an ad.
  useEffect(() => {
    if (!result) {
      setPreviewUrl(null);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;

    if (unlocked) {
      objectUrl = URL.createObjectURL(result.blob);
      setPreviewUrl(objectUrl);
    } else {
      const srcUrl = URL.createObjectURL(result.blob);
      const im = new Image();
      im.onload = () => {
        URL.revokeObjectURL(srcUrl);
        if (cancelled) return;
        const clean = document.createElement("canvas");
        clean.width = result.width;
        clean.height = result.height;
        clean.getContext("2d")!.drawImage(im, 0, 0);
        withWatermark(clean).toBlob((b) => {
          if (cancelled || !b) return;
          objectUrl = URL.createObjectURL(b);
          setPreviewUrl(objectUrl);
        }, "image/png");
      };
      im.src = srcUrl;
    }

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
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

  async function copyDataUri() {
    if (!result || !unlocked) return;
    try {
      const dataUri = await new Promise<string>((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result as string);
        fr.onerror = () => rej(fr.error ?? new Error("read failed"));
        fr.readAsDataURL(result.blob);
      });
      await navigator.clipboard.writeText(dataUri);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("The browser blocked clipboard access.");
    }
  }

  function resetParams() {
    if (img) {
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
    }
    setPercent(50);
    setMode("pixels");
    setLockAspect(true);
    setFormat(file ? formatFromMime(file.type) : "jpeg");
  }

  function startOver() {
    setStep("upload");
    setFile(null);
    setImg(null);
    setResult(null);
    setEncodeMs(null);
    setUnlocked(false);
    setError(null);
  }

  const originalKb = file ? file.size / 1024 : 0;
  const resultKb = result ? result.blob.size / 1024 : 0;

  // Scale diagram — original outline vs new outline, both fit into a small box.
  const ow = img?.naturalWidth ?? 1;
  const oh = img?.naturalHeight ?? 1;
  const boxW = 132;
  const boxH = 74;
  const s = Math.min(boxW / Math.max(ow, targetW || 1), boxH / Math.max(oh, targetH || 1));

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
    <div className={STUDIO_FRAME}>
      <button
        onClick={startOver}
        className="text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
      >
        ← Choose a different photo
      </button>

      {/* Telemetry bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">aspect_ratio</span>
          <h2 className="font-display text-base font-semibold">Resizer</h2>
          <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[11px] text-secondary">
            {mode === "pixels" ? "PX" : `${percent}%`}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatPill icon="percent" label="Scale" value={img ? `${scalePct}%` : "—"} tone={upscaling ? "warn" : "secondary"} />
          <StatPill icon="crop_free" label="New" value={result ? `${result.width}×${result.height}` : `${targetW}×${targetH}`} tone="primary" />
          <StatPill icon="download" label="Output" value={result ? formatKb(resultKb) : "—"} />
          <StatPill icon="timer" label="Encoded" value={encodeMs != null ? `${encodeMs} ms` : "—"} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Viewport */}
        <div className="lg:col-span-8">
          <div className="overflow-hidden rounded-xl bg-black">
            <div className="flex items-center justify-between bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
              <span className="flex items-center gap-2 truncate">
                <span className="h-2 w-2 shrink-0 rounded-full bg-secondary" />
                <span className="truncate">{file?.name}</span>
              </span>
              <span className="shrink-0 font-mono text-outline">
                {img ? `${img.naturalWidth} × ${img.naturalHeight}` : "…"}
                {" → "}
                <span className="text-secondary">{targetW} × {targetH}</span>
              </span>
            </div>

            <div className="relative flex h-[360px] items-center justify-center p-4 sm:h-[460px]">
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Resized preview" className="max-h-full max-w-full object-contain" />
              )}
              {!previewUrl && <span className="text-sm text-outline">{processing ? "Resizing…" : "…"}</span>}
              <span className="absolute bottom-3 right-3 rounded-lg bg-surface-container-lowest/90 px-2 py-1 font-mono text-[11px] text-secondary backdrop-blur">
                {result ? `${result.width} × ${result.height}` : `${targetW} × ${targetH}`}
              </span>
            </div>

            <div className="flex items-center justify-between bg-surface-container-low px-3 py-1.5 text-[11px] text-outline">
              <span>{upscaling ? "Upscaling — the image is enlarged past its native size" : "Re-sampled with the browser's bilinear scaler"}</span>
              <span className="font-mono">{format === "jpeg" ? "JPG" : format.toUpperCase()} · q92</span>
            </div>
          </div>
        </div>

        {/* Config panel */}
        <div className="space-y-4 lg:col-span-4">
          <div className="space-y-4 rounded-xl bg-surface-container-low p-4">
            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-outline">Resize by</span>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-container-lowest p-1">
                {(["pixels", "percent"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`rounded px-2 py-1.5 text-xs font-medium capitalize transition-colors ${
                      mode === m ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {mode === "pixels" ? (
              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label htmlFor="w" className="mb-1 block text-xs font-medium text-on-surface">Width</label>
                    <input
                      id="w"
                      type="number"
                      min={1}
                      value={width}
                      onChange={(e) => onWidthChange(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary/60 focus:outline-none"
                    />
                  </div>
                  <span className="pb-2.5 text-outline">×</span>
                  <div className="flex-1">
                    <label htmlFor="h" className="mb-1 block text-xs font-medium text-on-surface">Height</label>
                    <input
                      id="h"
                      type="number"
                      min={1}
                      value={height}
                      onChange={(e) => onHeightChange(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary/60 focus:outline-none"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <input type="checkbox" checked={lockAspect} onChange={(e) => setLockAspect(e.target.checked)} className="accent-primary" />
                  Lock aspect ratio
                </label>
              </div>
            ) : (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor="pct" className="text-xs font-medium text-on-surface">Scale</label>
                  <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[11px] text-secondary">{percent}%</span>
                </div>
                <input
                  id="pct"
                  type="range"
                  min={1}
                  max={200}
                  value={percent}
                  onChange={(e) => setPercent(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="mt-2 grid grid-cols-6 gap-1">
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPercent(p)}
                      className={`rounded px-1 py-1 font-mono text-[11px] transition-colors ${
                        percent === p ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-outline-variant/30 pt-3">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-outline">Output format</span>
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-surface-container-lowest p-1">
                {FORMATS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`rounded px-2 py-1.5 text-xs font-medium uppercase transition-colors ${
                      format === f ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {f === "jpeg" ? "JPG" : f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scale diagram */}
          <div className="rounded-xl bg-surface-container-low p-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-outline">Original vs new</span>
              <span className={`font-mono font-semibold ${upscaling ? "text-amber-400" : "text-secondary"}`}>
                {img ? `${scalePct}%` : "…"}
              </span>
            </div>
            <div className="relative mx-auto" style={{ width: boxW, height: boxH }}>
              <div
                className="absolute left-0 top-0 border border-outline"
                style={{ width: Math.max(2, ow * s), height: Math.max(2, oh * s) }}
              />
              <div
                className={`absolute left-0 top-0 border-2 ${upscaling ? "border-amber-400 bg-amber-400/10" : "border-secondary bg-secondary/10"}`}
                style={{ width: Math.max(2, (targetW || 1) * s), height: Math.max(2, (targetH || 1) * s) }}
              />
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10px] text-outline">
              <span>orig {img ? `${img.naturalWidth}×${img.naturalHeight}` : "…"}</span>
              <span className="text-secondary">{targetW}×{targetH}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => (unlocked ? onAdComplete() : setShowAdGate(true))}
              disabled={!result || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-[0_0_20px_-4px_rgba(192,193,255,0.5)] transition-colors hover:bg-primary-container hover:text-on-primary-container disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              {processing ? "Resizing…" : unlocked ? `Download again (${formatKb(resultKb)})` : "Watch ad to download — free"}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={copyDataUri}
                disabled={!unlocked}
                title={unlocked ? "Copy the resized image as a data: URI" : "Unlocks after download"}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-surface-container px-3 py-2 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[16px]">{copied ? "check" : "content_copy"}</span>
                {copied ? "Copied" : "Copy data URI"}
              </button>
              <button
                onClick={resetParams}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-surface-container px-3 py-2 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      {showAdGate && <AdGate onComplete={onAdComplete} onCancel={() => setShowAdGate(false)} />}
    </div>
  );
}
