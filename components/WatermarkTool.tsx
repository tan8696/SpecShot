"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { compressToQuality, drawResized, formatFromMime, loadImageFile, type CompressFormat, type CompressResult } from "@/lib/engine/compress";
import { applyWatermark, withWatermark, type WatermarkPosition } from "@/lib/engine/watermark";
import { downloadBlob } from "@/lib/download";
import { Notice } from "./Notice";
import { UploadScreen } from "./UploadScreen";
import { AdGate } from "./AdGate";
import { StatPill, StudioPrivacyNote, formatKb, STUDIO_FRAME } from "./studioUi";

type Step = "upload" | "configure";

const POSITIONS: { id: WatermarkPosition; label: string; icon: string }[] = [
  { id: "top-left", label: "Top left", icon: "north_west" },
  { id: "top-right", label: "Top right", icon: "north_east" },
  { id: "center", label: "Center", icon: "center_focus_weak" },
  { id: "bottom-left", label: "Bottom left", icon: "south_west" },
  { id: "bottom-right", label: "Bottom right", icon: "south_east" },
  { id: "tile", label: "Tiled", icon: "grid_view" },
];

export function WatermarkTool() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [format, setFormat] = useState<CompressFormat>("jpeg");
  const [text, setText] = useState("© Your Name");
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const [opacity, setOpacity] = useState(50);
  const [position, setPosition] = useState<WatermarkPosition>("bottom-right");
  const [result, setResult] = useState<CompressResult | null>(null);
  const [encodeMs, setEncodeMs] = useState<number | null>(null);
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
      setStep("configure");
    } catch {
      setError("Could not read that image file.");
    }
  }

  async function onLogoFile(f: File | undefined) {
    if (!f) {
      setLogo(null);
      return;
    }
    try {
      setLogo(await loadImageFile(f));
    } catch {
      setError("Could not read that logo file.");
    }
  }

  useEffect(() => {
    if (!img) return;
    setUnlocked(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setProcessing(true);
      setError(null);
      try {
        const base = drawResized(img);
        const marked = applyWatermark(base, { text, logo: logo ?? undefined, opacity: opacity / 100, position });
        const t0 = performance.now();
        const r = await compressToQuality(marked, format, 92);
        setEncodeMs(Math.round(performance.now() - t0));
        setResult(r);
      } catch {
        setError("Could not watermark that image.");
      } finally {
        setProcessing(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [img, text, logo, opacity, position, format]);

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
      // clean already carries the user's own watermark — this second,
      // obnoxious overlay is only to keep the pre-unlock preview
      // un-save-able, same as every other tool's ad gate.
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
    downloadBlob(result.blob, `${base}-watermarked.${ext}`);
  }

  function startOver() {
    setStep("upload");
    setFile(null);
    setImg(null);
    setLogo(null);
    setResult(null);
    setEncodeMs(null);
    setUnlocked(false);
    setError(null);
  }

  if (step === "upload") {
    return (
      <>
        <UploadScreen
          onFile={onFile}
          heading="Watermark a photo"
          subheading="Stamp your own text or logo onto an image — entirely in your browser."
          hint="Any JPEG, PNG, or WebP"
        />
        {error && <Notice tone="error">{error}</Notice>}
      </>
    );
  }

  const dims = result ? `${result.width} × ${result.height}` : "…";

  return (
    <div className={STUDIO_FRAME}>
      <button onClick={startOver} className="text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface">
        ← Choose a different photo
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">branding_watermark</span>
          <h2 className="font-display text-base font-semibold">Watermark</h2>
          <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[11px] text-secondary">{logo ? "LOGO" : "TEXT"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatPill icon="crop_free" label="Size" value={dims} tone="primary" />
          <StatPill icon="download" label="Output" value={result ? formatKb(result.blob.size / 1024) : "—"} />
          <StatPill icon="timer" label="Encoded" value={encodeMs != null ? `${encodeMs} ms` : "—"} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="overflow-hidden rounded-xl bg-black">
            <div className="flex items-center justify-between bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
              <span className="truncate">{file?.name}</span>
              <span className="shrink-0 font-mono text-outline">{dims}</span>
            </div>
            <div className="flex items-center justify-center p-3">
              <canvas ref={canvasRef} role="img" aria-label="Preview of the watermarked image" className="max-h-[58vh] max-w-full object-contain" />
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <div className="space-y-4 rounded-xl bg-surface-container-low p-4">
            <div>
              <label htmlFor="wmText" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-outline">
                Watermark text
              </label>
              <input
                id="wmText"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="© Your Name"
                className="w-full rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary/60 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="wmLogo" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-outline">
                Or a logo image (replaces the text)
              </label>
              <input
                id="wmLogo"
                type="file"
                accept="image/*"
                onChange={(e) => onLogoFile(e.target.files?.[0])}
                className="w-full text-xs text-on-surface-variant file:mr-2 file:rounded-md file:border-0 file:bg-surface-container-high file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-on-surface"
              />
            </div>

            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-outline">Position</span>
              <div className="grid grid-cols-6 gap-1">
                {POSITIONS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPosition(p.id)}
                    aria-label={p.label}
                    aria-pressed={position === p.id}
                    className={`flex items-center justify-center rounded-lg py-2 transition-colors ${
                      position === p.id
                        ? "bg-primary-container text-on-primary-container"
                        : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{p.icon}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="wmOpacity" className="text-xs font-medium text-on-surface">
                  Opacity
                </label>
                <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[11px] text-secondary">{opacity}%</span>
              </div>
              <input
                id="wmOpacity"
                type="range"
                min={5}
                max={100}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>

          <button
            onClick={() => (unlocked ? onAdComplete() : setShowAdGate(true))}
            disabled={!result || processing}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-[0_0_20px_-4px_rgba(192,193,255,0.5)] transition-colors hover:bg-primary-container hover:text-on-primary-container disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            {processing ? "Applying…" : unlocked ? `Download again (${result ? formatKb(result.blob.size / 1024) : ""})` : "Watch ad to download — free"}
          </button>
        </div>
      </div>

      <StudioPrivacyNote />
      {error && <Notice tone="error">{error}</Notice>}
      {showAdGate && <AdGate onComplete={onAdComplete} onCancel={() => setShowAdGate(false)} />}
    </div>
  );
}
