"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { compressToQuality, drawResized, formatFromMime, loadImageFile, type CompressFormat, type CompressResult } from "@/lib/engine/compress";
import { wrapText, drawTextBlock } from "@/lib/engine/textlayer";
import { withWatermark } from "@/lib/engine/watermark";
import { downloadBlob } from "@/lib/download";
import { Notice } from "./Notice";
import { UploadScreen } from "./UploadScreen";
import { AdGate } from "./AdGate";
import { StatPill, StudioPrivacyNote, formatKb, STUDIO_FRAME } from "./studioUi";

type Step = "upload" | "configure";

const MEME_FONT = 'bold {px}px Impact, "Haettenschweiler", "Arial Narrow", sans-serif';

export function MemeTool() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [format, setFormat] = useState<CompressFormat>("jpeg");
  const [top, setTop] = useState("");
  const [bottom, setBottom] = useState("");
  const [fontPct, setFontPct] = useState(9);
  const [strokePct, setStrokePct] = useState(8);
  const [allCaps, setAllCaps] = useState(true);
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

  useEffect(() => {
    if (!img) return;
    setUnlocked(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setProcessing(true);
      setError(null);
      try {
        const canvas = drawResized(img);
        const ctx = canvas.getContext("2d")!;
        const fontPx = Math.max(12, Math.round((canvas.width * fontPct) / 100));
        const font = MEME_FONT.replace("{px}", String(fontPx));
        const strokeWidth = Math.max(2, (fontPx * strokePct) / 100);
        const maxWidth = canvas.width * 0.92;

        ctx.font = font;
        const measure = (s: string) => ctx.measureText(s).width;
        const shared = {
          font,
          fill: "#ffffff",
          stroke: "#000000",
          strokeWidth,
          lineHeight: fontPx * 1.08,
          paddingPx: fontPx * 0.35,
        } as const;

        const cap = (s: string) => (allCaps ? s.toUpperCase() : s);
        if (top.trim()) drawTextBlock(ctx, wrapText(measure, cap(top), maxWidth), canvas.width / 2, canvas.height, { ...shared, anchor: "top" });
        if (bottom.trim()) drawTextBlock(ctx, wrapText(measure, cap(bottom), maxWidth), canvas.width / 2, canvas.height, { ...shared, anchor: "bottom" });

        const t0 = performance.now();
        const r = await compressToQuality(canvas, format, 92);
        setEncodeMs(Math.round(performance.now() - t0));
        setResult(r);
      } catch {
        setError("Could not build that meme.");
      } finally {
        setProcessing(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [img, top, bottom, fontPct, strokePct, allCaps, format]);

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
    const base = file.name.replace(/\.[^.]+$/, "") || "meme";
    downloadBlob(result.blob, `${base}-meme.${ext}`);
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

  if (step === "upload") {
    return (
      <>
        <UploadScreen
          onFile={onFile}
          heading="Meme generator"
          subheading="Add top and bottom captions to any image, classic meme style — entirely in your browser."
          hint="Any JPEG, PNG, or WebP"
        />
        {error && <Notice tone="error">{error}</Notice>}
      </>
    );
  }

  const inputCls =
    "w-full rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary/60 focus:outline-none";
  const dims = result ? `${result.width} × ${result.height}` : "…";

  return (
    <div className={STUDIO_FRAME}>
      <button onClick={startOver} className="text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface">
        ← Choose a different photo
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">sentiment_very_satisfied</span>
          <h2 className="font-display text-base font-semibold">Meme Generator</h2>
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
              <canvas ref={canvasRef} role="img" aria-label="Meme preview" className="max-h-[62vh] max-w-full object-contain" />
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <div className="space-y-4 rounded-xl bg-surface-container-low p-4">
            <div>
              <label htmlFor="memeTop" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-outline">
                Top text
              </label>
              <input id="memeTop" type="text" value={top} onChange={(e) => setTop(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="memeBottom" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-outline">
                Bottom text
              </label>
              <input id="memeBottom" type="text" value={bottom} onChange={(e) => setBottom(e.target.value)} className={inputCls} />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="memeFont" className="text-xs font-medium text-on-surface">Font size</label>
                <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[11px] text-secondary">{fontPct}%</span>
              </div>
              <input id="memeFont" type="range" min={3} max={20} value={fontPct} onChange={(e) => setFontPct(Number(e.target.value))} className="w-full accent-primary" />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="memeStroke" className="text-xs font-medium text-on-surface">Outline</label>
                <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[11px] text-secondary">{strokePct}%</span>
              </div>
              <input id="memeStroke" type="range" min={0} max={20} value={strokePct} onChange={(e) => setStrokePct(Number(e.target.value))} className="w-full accent-primary" />
            </div>
            <label className="flex items-center gap-2 text-xs text-on-surface-variant">
              <input type="checkbox" checked={allCaps} onChange={(e) => setAllCaps(e.target.checked)} className="accent-primary" />
              ALL CAPS
            </label>
          </div>

          <button
            onClick={() => (unlocked ? onAdComplete() : setShowAdGate(true))}
            disabled={!result || processing}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-[0_0_20px_-4px_rgba(192,193,255,0.5)] transition-colors hover:bg-primary-container hover:text-on-primary-container disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            {processing ? "Rendering…" : unlocked ? `Download again (${result ? formatKb(result.blob.size / 1024) : ""})` : "Watch ad to download — free"}
          </button>
        </div>
      </div>

      <StudioPrivacyNote />
      {error && <Notice tone="error">{error}</Notice>}
      {showAdGate && <AdGate onComplete={onAdComplete} onCancel={() => setShowAdGate(false)} />}
    </div>
  );
}
