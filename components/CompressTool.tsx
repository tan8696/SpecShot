"use client";

import { useEffect, useRef, useState } from "react";
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
type ViewMode = "split" | "dual";

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
  const [encodeMs, setEncodeMs] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [showAdGate, setShowAdGate] = useState(false);

  const [view, setView] = useState<ViewMode>("split");
  const [split, setSplit] = useState(50);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

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

  // Original preview URL — the file exactly as picked, for the "before" side.
  useEffect(() => {
    if (!file) {
      setOriginalUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

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
        const t0 = performance.now();
        const r =
          sizeMode === "quality"
            ? await compressToQuality(canvas, format, quality)
            : await compressToTargetKb(canvas, format, targetKb);
        setEncodeMs(Math.round(performance.now() - t0));
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

  // The "after" side. Watermarked until this exact output has been unlocked
  // with an ad — otherwise the preview could just be right-click-saved and the
  // ad gate would be pointless.
  useEffect(() => {
    if (!result) {
      setCompressedUrl(null);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;

    if (unlocked) {
      objectUrl = URL.createObjectURL(result.blob);
      setCompressedUrl(objectUrl);
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
          setCompressedUrl(objectUrl);
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
    downloadBlob(result.blob, `${base}-compressed.${ext}`);
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
    setFormat(file ? formatFromMime(file.type) : "jpeg");
    setSizeMode("quality");
    setQuality(80);
    setTargetKb(200);
    setResizeEnabled(false);
    setMaxDim(1920);
    setSplit(50);
    setView("split");
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

  function moveSplit(clientX: number) {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSplit(Math.max(2, Math.min(98, pct)));
  }

  const originalKb = file ? file.size / 1024 : 0;
  const resultKb = result ? result.blob.size / 1024 : 0;
  const reduction = file && result ? Math.round((1 - result.blob.size / file.size) * 100) : 0;
  const outputFrac = file && result ? Math.min(100, (result.blob.size / file.size) * 100) : 0;
  const bigger = reduction < 0;

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
    <div className="space-y-4 rounded-2xl bg-surface-container-lowest p-4 font-body text-on-surface shadow-2xl sm:p-6">
      <button
        onClick={startOver}
        className="text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
      >
        ← Choose a different photo
      </button>

      {/* Telemetry / control bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">compress</span>
          <h2 className="font-display text-base font-semibold">Compressor</h2>
          <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[11px] text-secondary">
            {format === "jpeg" ? "JPG" : format.toUpperCase()}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Stat icon="savings" label="Saved" value={result ? (bigger ? `+${-reduction}%` : `−${reduction}%`) : "—"} tone={bigger ? "warn" : "secondary"} />
          <Stat icon="download" label="Output" value={result ? formatKb(resultKb) : "—"} tone="primary" />
          <Stat icon="timer" label="Encoded" value={encodeMs != null ? `${encodeMs} ms` : "—"} />
          <div className="flex rounded-lg bg-surface-container p-0.5">
            {(["split", "dual"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setView(m)}
                className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  view === m ? "bg-primary/20 text-primary-fixed" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{m === "split" ? "compare" : "view_column"}</span>
                {m === "split" ? "Split" : "Dual"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Viewport stage */}
        <div className="lg:col-span-8">
          <div className="overflow-hidden rounded-xl bg-black">
            <div className="flex items-center justify-between bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
              <span className="flex items-center gap-2 truncate">
                <span className="h-2 w-2 shrink-0 rounded-full bg-secondary" />
                <span className="truncate">{file?.name}</span>
              </span>
              <span className="shrink-0 font-mono text-outline">
                {result ? `${result.width} × ${result.height}` : "…"}
              </span>
            </div>

            {view === "split" ? (
              <div
                ref={stageRef}
                onPointerDown={(e) => {
                  draggingRef.current = true;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  moveSplit(e.clientX);
                }}
                onPointerMove={(e) => draggingRef.current && moveSplit(e.clientX)}
                onPointerUp={() => (draggingRef.current = false)}
                onPointerCancel={() => (draggingRef.current = false)}
                className="relative h-[360px] cursor-ew-resize touch-none select-none sm:h-[460px]"
              >
                {compressedUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={compressedUrl} alt="Compressed" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
                )}
                {originalUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={originalUrl}
                    alt="Original"
                    draggable={false}
                    style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
                    className="pointer-events-none absolute inset-0 h-full w-full object-contain"
                  />
                )}
                <span className="absolute bottom-3 left-3 rounded-lg bg-surface-container-lowest/90 px-2 py-1 text-[11px] font-medium text-on-surface-variant backdrop-blur">
                  Original · <span className="font-mono text-on-surface">{formatKb(originalKb)}</span>
                </span>
                <span className="absolute bottom-3 right-3 rounded-lg bg-surface-container-lowest/90 px-2 py-1 text-[11px] font-medium text-secondary backdrop-blur">
                  {format === "jpeg" ? "JPG" : format.toUpperCase()} · <span className="font-mono">{result ? formatKb(resultKb) : "…"}</span>
                </span>
                <div
                  role="slider"
                  tabIndex={0}
                  aria-label="Comparison position"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(split)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowLeft") setSplit((s) => Math.max(2, s - 2));
                    if (e.key === "ArrowRight") setSplit((s) => Math.min(98, s + 2));
                  }}
                  style={{ left: `${split}%` }}
                  className="absolute top-0 bottom-0 -ml-px w-0.5 bg-secondary shadow-[0_0_12px_rgba(123,208,255,0.8)] outline-none"
                >
                  <span className="absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-surface-container-lowest text-secondary shadow-xl">
                    <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid h-[360px] grid-cols-2 gap-1 bg-black p-1 sm:h-[460px]">
                <figure className="relative overflow-hidden rounded-lg bg-surface-container">
                  {originalUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={originalUrl} alt="Original" className="h-full w-full object-contain" />
                  )}
                  <figcaption className="absolute bottom-2 left-2 rounded bg-surface-container-lowest/90 px-2 py-0.5 text-[11px] text-on-surface-variant backdrop-blur">
                    Original · <span className="font-mono text-on-surface">{formatKb(originalKb)}</span>
                  </figcaption>
                </figure>
                <figure className="relative overflow-hidden rounded-lg bg-surface-container">
                  {compressedUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={compressedUrl} alt="Compressed" className="h-full w-full object-contain" />
                  )}
                  <figcaption className="absolute bottom-2 left-2 rounded bg-surface-container-lowest/90 px-2 py-0.5 text-[11px] text-secondary backdrop-blur">
                    {format === "jpeg" ? "JPG" : format.toUpperCase()} · <span className="font-mono">{result ? formatKb(resultKb) : "…"}</span>
                  </figcaption>
                </figure>
              </div>
            )}

            <div className="flex items-center justify-between bg-surface-container-low px-3 py-1.5 text-[11px] text-outline">
              <span>Metadata (EXIF, GPS) is dropped on re-encode</span>
              <span className="font-mono">
                {sizeMode === "quality" ? `q${quality}` : `target ${targetKb} KB`}
              </span>
            </div>
          </div>
        </div>

        {/* Config panel */}
        <div className="space-y-4 lg:col-span-4">
          <div className="space-y-4 rounded-xl bg-surface-container-low p-4">
            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-outline">Format</span>
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

            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-outline">Compress by</span>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-container-lowest p-1">
                <button
                  onClick={() => setSizeMode("quality")}
                  className={`rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                    sizeMode === "quality" ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Visual quality
                </button>
                <button
                  onClick={() => setSizeMode("target")}
                  disabled={format === "png"}
                  className={`rounded px-2 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    sizeMode === "target" ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Exact KB
                </button>
              </div>
            </div>

            {sizeMode === "quality" ? (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor="quality" className="text-xs font-medium text-on-surface">
                    Quality index
                  </label>
                  <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[11px] text-secondary">{quality}%</span>
                </div>
                <input
                  id="quality"
                  type="range"
                  min={10}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  disabled={format === "png"}
                  className="w-full accent-primary disabled:opacity-40"
                />
                <div className="mt-1 flex justify-between font-mono text-[10px] text-outline">
                  <span>10 · smallest</span>
                  <span>100 · lossless</span>
                </div>
                {format === "png" && <p className="mt-1 text-[11px] text-outline">PNG is lossless — no quality knob.</p>}
              </div>
            ) : (
              <div>
                <label htmlFor="targetKb" className="mb-1 block text-xs font-medium text-on-surface">
                  Target file size
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="targetKb"
                    type="number"
                    min={5}
                    value={targetKb}
                    onChange={(e) => setTargetKb(Math.max(5, Number(e.target.value) || 5))}
                    className="w-full rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary/60 focus:outline-none"
                  />
                  <span className="shrink-0 text-xs text-outline">KB</span>
                </div>
                <p className="mt-1 text-[11px] text-outline">Found by a multi-pass quality bisection.</p>
              </div>
            )}

            <div className="border-t border-outline-variant/30 pt-3">
              <label className="flex items-center gap-2 text-xs font-medium text-on-surface">
                <input
                  type="checkbox"
                  checked={resizeEnabled}
                  onChange={(e) => setResizeEnabled(e.target.checked)}
                  className="accent-primary"
                />
                Also resize
              </label>
              {resizeEnabled && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min={16}
                    value={maxDim}
                    onChange={(e) => setMaxDim(Math.max(16, Number(e.target.value) || 16))}
                    className="w-full rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary/60 focus:outline-none"
                  />
                  <span className="shrink-0 text-[11px] text-outline">px, longest side</span>
                </div>
              )}
            </div>
          </div>

          {/* Reduction ratio */}
          <div className="space-y-2 rounded-xl bg-surface-container-low p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-outline">Output vs original</span>
              <span className={`font-mono font-semibold ${bigger ? "text-amber-400" : "text-secondary"}`}>
                {result ? (bigger ? `+${-reduction}% larger` : `${reduction}% saved`) : "…"}
              </span>
            </div>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-container-lowest">
              <div
                className={`h-full transition-all duration-300 ${bigger ? "bg-amber-400" : "bg-secondary"}`}
                style={{ width: `${Math.max(2, outputFrac)}%` }}
              />
            </div>
            <div className="flex justify-between font-mono text-[10px] text-outline">
              <span>origin {formatKb(originalKb)}</span>
              <span>{result ? formatKb(resultKb) : "…"}</span>
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
              {processing ? "Compressing…" : unlocked ? `Download again (${formatKb(resultKb)})` : "Watch ad to download — free"}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={copyDataUri}
                disabled={!unlocked}
                title={unlocked ? "Copy the compressed image as a data: URI" : "Unlocks after download"}
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

function Stat({ icon, label, value, tone = "neutral" }: { icon: string; label: string; value: string; tone?: "primary" | "secondary" | "warn" | "neutral" }) {
  const color =
    tone === "primary" ? "text-primary" : tone === "secondary" ? "text-secondary" : tone === "warn" ? "text-amber-400" : "text-on-surface";
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-surface-container-lowest px-2.5 py-1">
      <span className={`material-symbols-outlined text-[15px] ${color}`}>{icon}</span>
      <span className="text-[10px] uppercase tracking-wider text-outline">{label}</span>
      <span className={`font-mono text-xs font-medium ${color}`}>{value}</span>
    </div>
  );
}

function formatKb(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(0)} KB`;
}
