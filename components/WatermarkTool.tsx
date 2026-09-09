"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { compressToQuality, drawResized, formatFromMime, loadImageFile, type CompressFormat, type CompressResult } from "@/lib/engine/compress";
import { applyWatermark, withWatermark, type WatermarkPosition } from "@/lib/engine/watermark";
import { downloadBlob } from "@/lib/download";
import { Notice } from "./Notice";
import { UploadScreen } from "./UploadScreen";
import { AdGate } from "./AdGate";

type Step = "upload" | "configure";

const POSITIONS: { id: WatermarkPosition; label: string }[] = [
  { id: "top-left", label: "↖" },
  { id: "top-right", label: "↗" },
  { id: "center", label: "•" },
  { id: "bottom-left", label: "↙" },
  { id: "bottom-right", label: "↘" },
  { id: "tile", label: "▦" },
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
        const r = await compressToQuality(marked, format, 92);
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
            <label htmlFor="wmText" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Watermark text
            </label>
            <input
              id="wmText"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="© Your Name"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            <p className="mt-1 text-xs text-slate-500">Ignored in tile mode unless it's set.</p>
          </div>

          <div>
            <label htmlFor="wmLogo" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Or a logo image (optional)
            </label>
            <input
              id="wmLogo"
              type="file"
              accept="image/*"
              onChange={(e) => onLogoFile(e.target.files?.[0])}
              className="w-full text-xs text-slate-600 file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 dark:text-slate-400 dark:file:bg-slate-800 dark:file:text-slate-200"
            />
            <p className="mt-1 text-xs text-slate-500">A logo replaces the text everywhere except tile mode.</p>
          </div>

          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Position
            </span>
            <div className="grid grid-cols-6 gap-1">
              {POSITIONS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPosition(p.id)}
                  aria-label={p.id}
                  aria-pressed={position === p.id}
                  className={`rounded-md border py-2 text-sm transition-colors ${
                    position === p.id
                      ? "border-indigo-500 bg-indigo-500 text-white"
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="wmOpacity" className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                Opacity
              </label>
              <span className="font-mono text-xs text-slate-500">{opacity}%</span>
            </div>
            <input
              id="wmOpacity"
              type="range"
              min={5}
              max={100}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>

        {error && <Notice tone="error">{error}</Notice>}
      </aside>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_260px]">
          <div className="flex items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <canvas ref={canvasRef} role="img" aria-label="Preview of the watermarked image" className="h-auto max-h-[70vh] w-full object-contain" />
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Result</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-600 dark:text-slate-400">Dimensions</dt>
                  <dd className="font-mono text-slate-900 dark:text-slate-100">{result ? `${result.width}×${result.height}` : "…"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600 dark:text-slate-400">File size</dt>
                  <dd className="font-mono text-slate-900 dark:text-slate-100">
                    {result ? `${(result.blob.size / 1024).toFixed(1)}KB` : "…"}
                  </dd>
                </div>
              </dl>
            </div>

            <button
              onClick={() => (unlocked ? onAdComplete() : setShowAdGate(true))}
              disabled={!result || processing}
              className="w-full rounded-md bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing ? "Applying…" : unlocked ? "Download again" : "Watch ad to download — free"}
            </button>
          </div>
        </div>
      </div>

      {showAdGate && <AdGate onComplete={onAdComplete} onCancel={() => setShowAdGate(false)} />}
    </div>
  );
}
