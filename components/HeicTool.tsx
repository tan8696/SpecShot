"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { compressToQuality, drawResized, loadImageFile, type CompressResult } from "@/lib/engine/compress";
import { decodeHeic, looksLikeHeic } from "@/lib/engine/heic";
import { withWatermark } from "@/lib/engine/watermark";
import { downloadBlob } from "@/lib/download";
import { Notice } from "./Notice";
import { UploadScreen } from "./UploadScreen";
import { AdGate } from "./AdGate";
import { StatPill, StudioPrivacyNote, formatKb, STUDIO_FRAME } from "./studioUi";

type Step = "upload" | "decoding" | "configure";
type Target = "jpeg" | "png";
const LABELS: Record<Target, string> = { jpeg: "JPG", png: "PNG" };

/** HEIC/HEIF -> JPG/PNG. Decodes the HEIC to a PNG via heic2any (WASM),
 * loads that as an image, then runs the same configure -> watermarked
 * preview -> ad-gate -> download flow as every other tool. */
export function HeicTool({ defaultTarget = "jpeg" }: { defaultTarget?: Target }) {
  const [step, setStep] = useState<Step>("upload");
  const [name, setName] = useState("photo");
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [target, setTarget] = useState<Target>(defaultTarget);
  const [quality, setQuality] = useState(92);
  const [result, setResult] = useState<CompressResult | null>(null);
  const [encodeMs, setEncodeMs] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [showAdGate, setShowAdGate] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function onFile(f: File) {
    setError(null);
    setResult(null);
    if (!looksLikeHeic(f)) {
      setError("That doesn't look like a HEIC or HEIF file. iPhone photos usually end in .heic.");
      return;
    }
    setName(f.name.replace(/\.[^.]+$/, "") || "photo");
    setStep("decoding");
    try {
      const png = await decodeHeic(f);
      const loaded = await loadImageFile(png);
      setImg(loaded);
      setTarget(defaultTarget);
      setStep("configure");
    } catch {
      setError("Could not decode that HEIC file — it may be corrupt or an unsupported variant.");
      setStep("upload");
    }
  }

  useEffect(() => {
    if (!img) return;
    setUnlocked(false);
    let cancelled = false;
    (async () => {
      setProcessing(true);
      setError(null);
      try {
        const canvas = drawResized(img);
        const t0 = performance.now();
        const r = await compressToQuality(canvas, target, quality);
        if (cancelled) return;
        setEncodeMs(Math.round(performance.now() - t0));
        setResult(r);
      } catch {
        if (!cancelled) setError("Could not convert that image.");
      } finally {
        if (!cancelled) setProcessing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [img, target, quality]);

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
    if (!result) return;
    setShowAdGate(false);
    setUnlocked(true);
    downloadBlob(result.blob, `${name}.${target === "jpeg" ? "jpg" : "png"}`);
  }

  function startOver() {
    setStep("upload");
    setImg(null);
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
          heading="Convert HEIC"
          subheading="Turn an iPhone HEIC/HEIF photo into a JPG or PNG anything can open — entirely in your browser."
          hint="A .heic or .heif file"
          accept="image/heic,image/heif,.heic,.heif"
        />
        {error && <Notice tone="error">{error}</Notice>}
      </>
    );
  }

  if (step === "decoding") {
    return (
      <div className="rounded-2xl bg-surface-container-lowest p-10 text-center font-body text-on-surface">
        <span className="material-symbols-outlined animate-spin text-[28px] text-primary">progress_activity</span>
        <p className="mt-3 text-sm text-on-surface-variant">
          Decoding HEIC… loading the decoder the first time can take a few seconds.
        </p>
      </div>
    );
  }

  const dims = result ? `${result.width} × ${result.height}` : "…";

  return (
    <div className={STUDIO_FRAME}>
      <button onClick={startOver} className="text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface">
        ← Choose a different file
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">phone_iphone</span>
          <h2 className="font-display text-base font-semibold">HEIC Converter</h2>
          <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[11px] text-secondary">→ {LABELS[target]}</span>
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
              <span className="truncate">{name}</span>
              <span className="shrink-0 font-mono text-outline">{dims}</span>
            </div>
            <div className="flex items-center justify-center p-3">
              <canvas ref={canvasRef} role="img" aria-label="Preview of the converted image" className="max-h-[58vh] max-w-full object-contain" />
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <div className="space-y-4 rounded-xl bg-surface-container-low p-4">
            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-outline">Convert to</span>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-container-lowest p-1">
                {(["jpeg", "png"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTarget(t)}
                    className={`rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                      target === t ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {target === "jpeg" ? (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor="heicQuality" className="text-xs font-medium text-on-surface">Quality</label>
                  <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[11px] text-secondary">{quality}%</span>
                </div>
                <input
                  id="heicQuality"
                  type="range"
                  min={1}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            ) : (
              <p className="text-[11px] text-outline">PNG is lossless — no quality knob.</p>
            )}
          </div>

          <button
            onClick={() => (unlocked ? onAdComplete() : setShowAdGate(true))}
            disabled={!result || processing}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-[0_0_20px_-4px_rgba(192,193,255,0.5)] transition-colors hover:bg-primary-container hover:text-on-primary-container disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            {processing ? "Converting…" : unlocked ? `Download again (${result ? formatKb(result.blob.size / 1024) : ""})` : "Watch ad to download — free"}
          </button>
        </div>
      </div>

      <StudioPrivacyNote />
      {error && <Notice tone="error">{error}</Notice>}
      {showAdGate && <AdGate onComplete={onAdComplete} onCancel={() => setShowAdGate(false)} />}
    </div>
  );
}
