"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { compressToQuality, drawResized, loadImageFile, type CompressResult } from "@/lib/engine/compress";
import { decodeHeic, looksLikeHeic } from "@/lib/engine/heic";
import { withWatermark } from "@/lib/engine/watermark";
import { downloadBlob } from "@/lib/download";
import { Notice } from "./Notice";
import { UploadScreen } from "./UploadScreen";
import { AdGate } from "./AdGate";

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
        const r = await compressToQuality(canvas, target, quality);
        if (!cancelled) setResult(r);
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
      <div className="py-20 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">Decoding HEIC… (loading the decoder the first time can take a few seconds)</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4">
        <button
          onClick={startOver}
          className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          ← Choose a different file
        </button>

        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Convert to
            </span>
            <div className="flex gap-1 rounded-md bg-slate-100 p-1 dark:bg-slate-950">
              {(["jpeg", "png"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTarget(t)}
                  className={`flex-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                    target === t
                      ? "bg-indigo-500 text-white"
                      : "text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {target === "jpeg" && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="heicQuality" className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Quality
                </label>
                <span className="font-mono text-xs text-slate-500">{quality}%</span>
              </div>
              <input
                id="heicQuality"
                type="range"
                min={1}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          )}
        </div>

        {error && <Notice tone="error">{error}</Notice>}
      </aside>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_260px]">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <canvas ref={canvasRef} role="img" aria-label="Preview of the converted image" className="h-auto w-full" />
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Result</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-600 dark:text-slate-400">Format</dt>
                  <dd className="font-mono text-slate-900 dark:text-slate-100">{LABELS[target]}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600 dark:text-slate-400">File size</dt>
                  <dd className="font-mono text-slate-900 dark:text-slate-100">
                    {result ? `${(result.blob.size / 1024).toFixed(1)}KB` : "…"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600 dark:text-slate-400">Dimensions</dt>
                  <dd className="font-mono text-slate-900 dark:text-slate-100">
                    {result ? `${result.width}×${result.height}` : "…"}
                  </dd>
                </div>
              </dl>
            </div>

            <button
              onClick={() => (unlocked ? onAdComplete() : setShowAdGate(true))}
              disabled={!result || processing}
              className="w-full rounded-md bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing ? "Converting…" : unlocked ? "Download again" : "Watch ad to download — free"}
            </button>
          </div>
        </div>
      </div>

      {showAdGate && <AdGate onComplete={onAdComplete} onCancel={() => setShowAdGate(false)} />}
    </div>
  );
}
