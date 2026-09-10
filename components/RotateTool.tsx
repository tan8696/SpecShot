"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { loadImageFile, drawResized, compressToQuality, formatFromMime, type CompressFormat } from "@/lib/engine/compress";
import { rotateCanvas, flipCanvas, type Rotation } from "@/lib/engine/rotate";
import { withWatermark } from "@/lib/engine/watermark";
import { downloadBlob } from "@/lib/download";
import { Notice } from "./Notice";
import { UploadScreen } from "./UploadScreen";
import { AdGate } from "./AdGate";
import { StatPill, StudioPrivacyNote, formatKb, STUDIO_FRAME } from "./studioUi";

type Step = "upload" | "configure";

// No pure math to extract for 90°-increment rotate/flip (see lib/engine/rotate.ts) —
// re-encoding at a fixed high quality is the only "processing" step, so this
// tool applies transforms straight to a working canvas rather than
// recomputing from the original on every click.
const OUTPUT_QUALITY = 95;

function cloneCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = src.width;
  c.height = src.height;
  c.getContext("2d")!.drawImage(src, 0, 0);
  return c;
}

export function RotateTool() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<CompressFormat>("jpeg");
  const [original, setOriginal] = useState<HTMLCanvasElement | null>(null);
  const [working, setWorking] = useState<HTMLCanvasElement | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [encodeMs, setEncodeMs] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [showAdGate, setShowAdGate] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function onFile(f: File) {
    setError(null);
    try {
      const img = await loadImageFile(f);
      const base = drawResized(img);
      setFile(f);
      setFormat(formatFromMime(f.type));
      setOriginal(base);
      setWorking(cloneCanvas(base));
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
    const t0 = performance.now();
    compressToQuality(working, format, OUTPUT_QUALITY)
      .then((r) => {
        if (cancelled) return;
        setBlob(r.blob);
        setEncodeMs(Math.round(performance.now() - t0));
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
    setOriginal(null);
    setWorking(null);
    setBlob(null);
    setEncodeMs(null);
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

  const btn =
    "flex items-center justify-center gap-1 rounded-lg bg-surface-container px-2 py-2 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface";
  const dims = working ? `${working.width} × ${working.height}` : "…";

  return (
    <div className={STUDIO_FRAME}>
      <button onClick={startOver} className="text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface">
        ← Choose a different photo
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">rotate_90_degrees_cw</span>
          <h2 className="font-display text-base font-semibold">Rotate &amp; Flip</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatPill icon="crop_free" label="Size" value={dims} tone="primary" />
          <StatPill icon="download" label="Output" value={blob ? formatKb(blob.size / 1024) : "—"} />
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
              <canvas ref={canvasRef} role="img" aria-label="Preview of the rotated image" className="max-h-[58vh] max-w-full object-contain" />
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <div className="space-y-4 rounded-xl bg-surface-container-low p-4">
            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-outline">Rotate</span>
              <div className="grid grid-cols-3 gap-1.5">
                <button className={btn} onClick={() => working && apply(rotateCanvas(working, 270 as Rotation))}>
                  <span className="material-symbols-outlined text-[16px]">rotate_left</span>90°
                </button>
                <button className={btn} onClick={() => working && apply(rotateCanvas(working, 180 as Rotation))}>
                  180°
                </button>
                <button className={btn} onClick={() => working && apply(rotateCanvas(working, 90 as Rotation))}>
                  <span className="material-symbols-outlined text-[16px]">rotate_right</span>90°
                </button>
              </div>
            </div>
            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-outline">Flip</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button className={btn} onClick={() => working && apply(flipCanvas(working, "horizontal"))}>
                  <span className="material-symbols-outlined text-[16px]">flip</span>Horizontal
                </button>
                <button className={btn} onClick={() => working && apply(flipCanvas(working, "vertical"))}>
                  <span className="material-symbols-outlined rotate-90 text-[16px]">flip</span>Vertical
                </button>
              </div>
            </div>
            <button
              className={`${btn} w-full`}
              onClick={() => original && apply(cloneCanvas(original))}
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>Reset to original
            </button>
          </div>

          <button
            onClick={() => (unlocked ? onAdComplete() : setShowAdGate(true))}
            disabled={!blob || processing}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-[0_0_20px_-4px_rgba(192,193,255,0.5)] transition-colors hover:bg-primary-container hover:text-on-primary-container disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            {processing ? "Processing…" : unlocked ? `Download again (${blob ? formatKb(blob.size / 1024) : ""})` : "Watch ad to download — free"}
          </button>
        </div>
      </div>

      <StudioPrivacyNote />
      {error && <Notice tone="error">{error}</Notice>}
      {showAdGate && <AdGate onComplete={onAdComplete} onCancel={() => setShowAdGate(false)} />}
    </div>
  );
}
