"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  loadImageFile,
  cleanSignature,
  fitToSize,
  encodeSignature,
  NoInkFoundError,
  type Background,
} from "@/lib/engine/signature";
import type { CompressResult } from "@/lib/engine/compress";
import { downloadBlob } from "@/lib/download";
import { Notice } from "./Notice";
import { UploadScreen } from "./UploadScreen";
import { AdGate } from "./AdGate";
import { StatPill, StudioPrivacyNote, formatKb, STUDIO_FRAME } from "./studioUi";

type Step = "upload" | "configure";

export function SignatureTool() {
  const [step, setStep] = useState<Step>("upload");
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [threshold, setThreshold] = useState(150);
  const [background, setBackground] = useState<Background>("white");
  const [targetW, setTargetW] = useState(140);
  const [targetH, setTargetH] = useState(60);
  const [targetKb, setTargetKb] = useState(20);
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
      setImg(loaded);
      setStep("configure");
    } catch {
      setError("Could not read that image file.");
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
        const cropped = cleanSignature(img, threshold, background);
        const fitted = fitToSize(cropped, targetW, targetH, background);
        const r = await encodeSignature(fitted, background, targetKb);
        setResult(r);
      } catch (err) {
        setError(err instanceof NoInkFoundError ? err.message : "Could not process that image.");
        setResult(null);
      } finally {
        setProcessing(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [img, threshold, background, targetW, targetH, targetKb]);

  useLayoutEffect(() => {
    if (!result || !canvasRef.current) return;
    const c = canvasRef.current;
    const url = URL.createObjectURL(result.blob);
    const preview = new Image();
    preview.onload = () => {
      c.width = result.width;
      c.height = result.height;
      c.getContext("2d")!.drawImage(preview, 0, 0);
      URL.revokeObjectURL(url);
    };
    preview.src = url;
    return () => URL.revokeObjectURL(url);
  }, [result]);

  function onAdComplete() {
    if (!result) return;
    setShowAdGate(false);
    setUnlocked(true);
    const ext = background === "transparent" ? "png" : "jpg";
    downloadBlob(result.blob, `signature.${ext}`);
  }

  function startOver() {
    setStep("upload");
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
          heading="Clean up your signature"
          subheading="Photograph your signature on paper — SpecShot crops to the ink and removes shadows, ready for an exam portal upload."
          hint="Sign on plain paper, photograph it flat"
        />
        {error && <Notice tone="error">{error}</Notice>}
      </>
    );
  }

  const inputCls =
    "w-full rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary/60 focus:outline-none disabled:opacity-50";
  const dims = result ? `${result.width} × ${result.height}` : "…";

  return (
    <div className={STUDIO_FRAME}>
      <button onClick={startOver} className="text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface">
        ← Choose a different photo
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">draw</span>
          <h2 className="font-display text-base font-semibold">Signature Cleaner</h2>
          <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[11px] text-secondary">{background === "transparent" ? "PNG" : "JPG"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatPill icon="crop_free" label="Size" value={dims} tone="primary" />
          <StatPill icon="download" label="Output" value={result ? formatKb(result.blob.size / 1024) : "—"} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="overflow-hidden rounded-xl bg-black">
            <div className="flex items-center justify-between bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
              <span>Cleaned signature</span>
              <span className="shrink-0 font-mono text-outline">{dims}</span>
            </div>
            <div
              className="flex items-center justify-center p-6"
              style={{
                backgroundColor: background === "white" ? "#ffffff" : "#0e0e10",
                backgroundImage:
                  background === "transparent"
                    ? "linear-gradient(45deg, #2a2a2c 25%, transparent 25%), linear-gradient(-45deg, #2a2a2c 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2c 75%), linear-gradient(-45deg, transparent 75%, #2a2a2c 75%)"
                    : undefined,
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
              }}
            >
              <canvas ref={canvasRef} role="img" aria-label="Preview of the cleaned signature" className="max-h-[52vh] max-w-full" />
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <div className="space-y-4 rounded-xl bg-surface-container-low p-4">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="threshold" className="text-xs font-medium text-on-surface">Cleanup strength</label>
                <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[11px] text-secondary">{threshold}</span>
              </div>
              <input
                id="threshold"
                type="range"
                min={40}
                max={220}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <p className="mt-1 text-[11px] text-outline">Higher removes more paper shadow and texture.</p>
            </div>

            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-outline">Background</span>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-container-lowest p-1">
                {(["white", "transparent"] as const).map((b) => (
                  <button
                    key={b}
                    onClick={() => setBackground(b)}
                    className={`rounded px-2 py-1.5 text-xs font-medium capitalize transition-colors ${
                      background === b ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-outline">Exact size (px)</span>
              <div className="flex items-center gap-2">
                <input type="number" min={16} value={targetW} onChange={(e) => setTargetW(Math.max(16, Number(e.target.value) || 16))} className={inputCls} />
                <span className="text-outline">×</span>
                <input type="number" min={16} value={targetH} onChange={(e) => setTargetH(Math.max(16, Number(e.target.value) || 16))} className={inputCls} />
              </div>
              <p className="mt-1 text-[11px] text-outline">Match your exam portal's exact requirement.</p>
            </div>

            <div>
              <label htmlFor="sigTargetKb" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-outline">
                Target size (KB)
              </label>
              <input
                id="sigTargetKb"
                type="number"
                min={1}
                value={targetKb}
                onChange={(e) => setTargetKb(Math.max(1, Number(e.target.value) || 1))}
                disabled={background === "transparent"}
                className={inputCls}
              />
              {background === "transparent" && <p className="mt-1 text-[11px] text-outline">PNG (needed for transparency) has no size knob.</p>}
            </div>
          </div>

          <button
            onClick={() => (unlocked ? onAdComplete() : setShowAdGate(true))}
            disabled={!result || processing}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-[0_0_20px_-4px_rgba(192,193,255,0.5)] transition-colors hover:bg-primary-container hover:text-on-primary-container disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            {processing ? "Cleaning…" : unlocked ? `Download again (${result ? formatKb(result.blob.size / 1024) : ""})` : "Watch ad to download — free"}
          </button>
        </div>
      </div>

      <StudioPrivacyNote />
      {error && <Notice tone="error">{error}</Notice>}
      {showAdGate && <AdGate onComplete={onAdComplete} onCancel={() => setShowAdGate(false)} />}
    </div>
  );
}
