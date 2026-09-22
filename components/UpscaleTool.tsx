"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  compressToQuality,
  formatFromMime,
  loadImageFile,
  type CompressFormat,
  type CompressResult,
} from "@/lib/engine/compress";
import { upscaleCanvas, clampScale } from "@/lib/engine/upscale";
import { downloadBlob } from "@/lib/download";
import { stashHandoffImage } from "@/lib/handoff";
import { Notice } from "./Notice";
import { UploadScreen } from "./UploadScreen";
import { StatPill, StudioPrivacyNote, formatKb, STUDIO_FRAME } from "./studioUi";

type Step = "upload" | "configure";

const FORMATS: CompressFormat[] = ["jpeg", "png", "webp"];
const SCALES = [2, 3, 4];

export function UpscaleTool() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [format, setFormat] = useState<CompressFormat>("jpeg");
  const [scale, setScale] = useState(2);
  const [sharpen, setSharpen] = useState(60);

  const [result, setResult] = useState<CompressResult | null>(null);
  const [encodeMs, setEncodeMs] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function onFile(f: File) {
    setError(null);
    setResult(null);
    try {
      const loaded = await loadImageFile(f);
      setFile(f);
      setImg(loaded);
      setFormat(formatFromMime(f.type));
      setOriginalUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(f);
      });
      setScale(clampScale(loaded.naturalWidth, loaded.naturalHeight, 2));
      setStep("configure");
    } catch {
      setError("Could not read that image file.");
    }
  }

  // The requested scale, capped to what a canvas can still allocate — 4x on a
  // 12MP phone photo is 190MP, which silently encodes to nothing.
  const maxScale = img ? clampScale(img.naturalWidth, img.naturalHeight, Infinity) : 4;
  const effectiveScale = img ? clampScale(img.naturalWidth, img.naturalHeight, scale) : scale;
  const capped = effectiveScale < scale;
  const targetW = img ? Math.round(img.naturalWidth * effectiveScale) : 0;
  const targetH = img ? Math.round(img.naturalHeight * effectiveScale) : 0;

  // Debounced re-render.
  useEffect(() => {
    if (!img || targetW < 1 || targetH < 1) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setProcessing(true);
      setError(null);
      try {
        const t0 = performance.now();
        const canvas = upscaleCanvas(img, targetW, targetH, sharpen / 100);
        const r = await compressToQuality(canvas, format, 92);
        setEncodeMs(Math.round(performance.now() - t0));
        setResult(r);
      } catch {
        setError("Could not upscale that image — try a smaller scale factor.");
      } finally {
        setProcessing(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [img, targetW, targetH, format, sharpen]);

  useEffect(() => {
    if (!result) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(result.blob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [result]);

  useEffect(
    () => () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
    },
    [originalUrl]
  );

  function download() {
    if (!result || !file) return;
    const ext = format === "jpeg" ? "jpg" : format;
    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    downloadBlob(result.blob, `${base}-upscaled.${ext}`);
  }

  async function pipeToCompressor() {
    if (!result) return;
    const ext = format === "jpeg" ? "jpg" : format;
    const base = file?.name.replace(/\.[^.]+$/, "") || "image";
    const handoff = new File([result.blob], `${base}-upscaled.${ext}`, { type: result.blob.type || `image/${format}` });
    await stashHandoffImage(handoff).catch(() => {});
    router.push("/app/?tool=compress");
  }

  function startOver() {
    setStep("upload");
    setFile(null);
    setImg(null);
    setResult(null);
    setEncodeMs(null);
    setComparing(false);
    setError(null);
  }

  const resultKb = result ? result.blob.size / 1024 : 0;
  const megapixels = (targetW * targetH) / 1_000_000;

  if (step === "upload") {
    return (
      <>
        <UploadScreen
          onFile={onFile}
          heading="Upscale an image"
          subheading="Enlarge a photo 2×, 3× or 4× and sharpen it back up — entirely in your browser."
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
          <span className="material-symbols-outlined text-primary">hd</span>
          <h2 className="font-display text-base font-semibold">Upscaler</h2>
          <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[11px] text-secondary">
            {effectiveScale}×
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatPill
            icon="crop_free"
            label="New"
            value={result ? `${result.width}×${result.height}` : `${targetW}×${targetH}`}
            tone="primary"
          />
          <StatPill icon="grain" label="Pixels" value={`${megapixels.toFixed(1)} MP`} tone={capped ? "warn" : "secondary"} />
          <StatPill icon="download" label="Output" value={result ? formatKb(resultKb) : "—"} />
          <StatPill icon="timer" label="Rendered" value={encodeMs != null ? `${encodeMs} ms` : "—"} />
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
                <span className="text-secondary">
                  {targetW} × {targetH}
                </span>
              </span>
            </div>

            <div className="relative flex h-[360px] items-center justify-center p-4 sm:h-[460px]">
              {(comparing ? originalUrl : previewUrl) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={(comparing ? originalUrl : previewUrl) as string}
                  alt={comparing ? "Original" : "Upscaled preview"}
                  className="max-h-full max-w-full object-contain"
                />
              )}
              {!previewUrl && !comparing && <span className="text-sm text-outline">{processing ? "Upscaling…" : "…"}</span>}

              {/* Hold to see the source at the same on-screen size — the only
                  honest way to judge an enlargement. */}
              <button
                onMouseDown={() => setComparing(true)}
                onMouseUp={() => setComparing(false)}
                onMouseLeave={() => setComparing(false)}
                onTouchStart={() => setComparing(true)}
                onTouchEnd={() => setComparing(false)}
                disabled={!originalUrl}
                className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-surface-container-lowest/90 px-2 py-1 text-[11px] font-medium text-on-surface-variant backdrop-blur transition-colors hover:text-on-surface disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[14px]">compare</span>
                {comparing ? "Original" : "Hold to compare"}
              </button>

              <span className="absolute bottom-3 right-3 rounded-lg bg-surface-container-lowest/90 px-2 py-1 font-mono text-[11px] text-secondary backdrop-blur">
                {comparing && img ? `${img.naturalWidth} × ${img.naturalHeight}` : `${targetW} × ${targetH}`}
              </span>
            </div>

            <div className="flex items-center justify-between bg-surface-container-low px-3 py-1.5 text-[11px] text-outline">
              <span>Stepped 2× resample, then an unsharp mask — no detail is invented</span>
              <span className="font-mono">{format === "jpeg" ? "JPG" : format.toUpperCase()} · q92</span>
            </div>
          </div>
        </div>

        {/* Config panel */}
        <div className="space-y-4 lg:col-span-4">
          <div className="space-y-4 rounded-xl bg-surface-container-low p-4">
            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-outline">Scale factor</span>
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-surface-container-lowest p-1">
                {SCALES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setScale(s)}
                    disabled={s > maxScale}
                    className={`rounded px-2 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
                      scale === s ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>
              <p className="mt-1.5 font-mono text-[11px] text-outline">
                {img ? `${img.naturalWidth}×${img.naturalHeight} → ${targetW}×${targetH}` : "…"}
              </p>
            </div>

            <div className="border-t border-outline-variant/30 pt-3">
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="sharpen" className="text-xs font-medium text-on-surface">
                  Sharpen
                </label>
                <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[11px] text-secondary">{sharpen}%</span>
              </div>
              <input
                id="sharpen"
                type="range"
                min={0}
                max={150}
                value={sharpen}
                onChange={(e) => setSharpen(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <p className="mt-1 text-[11px] leading-snug text-outline">
                Enlarging softens edges. This restores local contrast; past about 100% it starts to show halos.
              </p>
            </div>

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

          {capped && (
            <Notice tone="warn">
              This photo is large enough that {scale}× would exceed what a browser canvas can hold, so it has been capped
              at {effectiveScale}×.
            </Notice>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={download}
              disabled={!result || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-[0_0_20px_-4px_rgba(192,193,255,0.5)] transition-colors hover:bg-primary-container hover:text-on-primary-container disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              {processing ? "Upscaling…" : `Download (${formatKb(resultKb)})`}
            </button>
            <button
              onClick={pipeToCompressor}
              disabled={!result}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-surface-container-high px-4 py-2 text-xs font-medium text-secondary transition-colors hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[16px]">compress</span>
              Send the upscale to the compressor
            </button>
          </div>
        </div>
      </div>

      <StudioPrivacyNote />

      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}
