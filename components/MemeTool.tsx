"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { compressToQuality, drawResized, formatFromMime, loadImageFile, type CompressFormat, type CompressResult } from "@/lib/engine/compress";
import { wrapText, drawTextBlock } from "@/lib/engine/textlayer";
import { withWatermark } from "@/lib/engine/watermark";
import { downloadBlob } from "@/lib/download";
import { Notice } from "./Notice";
import { UploadScreen } from "./UploadScreen";
import { AdGate } from "./AdGate";

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

        const r = await compressToQuality(canvas, format, 92);
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
            <label htmlFor="memeTop" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Top text
            </label>
            <input
              id="memeTop"
              type="text"
              value={top}
              onChange={(e) => setTop(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="memeBottom" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Bottom text
            </label>
            <input
              id="memeBottom"
              type="text"
              value={bottom}
              onChange={(e) => setBottom(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="memeFont" className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                Font size
              </label>
              <span className="font-mono text-xs text-slate-500">{fontPct}%</span>
            </div>
            <input id="memeFont" type="range" min={3} max={20} value={fontPct} onChange={(e) => setFontPct(Number(e.target.value))} className="w-full accent-indigo-500" />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="memeStroke" className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                Outline
              </label>
              <span className="font-mono text-xs text-slate-500">{strokePct}%</span>
            </div>
            <input id="memeStroke" type="range" min={0} max={20} value={strokePct} onChange={(e) => setStrokePct(Number(e.target.value))} className="w-full accent-indigo-500" />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <input type="checkbox" checked={allCaps} onChange={(e) => setAllCaps(e.target.checked)} className="accent-indigo-500" />
            ALL CAPS
          </label>
        </div>

        <button
          onClick={() => (unlocked ? onAdComplete() : setShowAdGate(true))}
          disabled={!result || processing}
          className="w-full rounded-md bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {processing ? "Rendering…" : unlocked ? "Download again" : "Watch ad to download — free"}
        </button>

        {error && <Notice tone="error">{error}</Notice>}
      </aside>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <canvas ref={canvasRef} role="img" aria-label="Meme preview" className="h-auto max-h-[75vh] w-full object-contain" />
      </div>

      {showAdGate && <AdGate onComplete={onAdComplete} onCancel={() => setShowAdGate(false)} />}
    </div>
  );
}
