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

type Step = "upload" | "configure";

export function SignatureTool() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
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
      setFile(f);
      setImg(loaded);
      setStep("configure");
    } catch {
      setError("Could not read that image file.");
    }
  }

  // Any settings change re-locks the download — a previously-watched ad only
  // covers the output it unlocked, not whatever you tweak it into next.
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
          heading="Clean up your signature"
          subheading="Photograph your signature on paper — SpecShot crops to the ink and removes shadows, ready for an exam portal upload."
          hint="Sign on plain paper, photograph it flat"
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
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="threshold" className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                Cleanup strength
              </label>
              <span className="font-mono text-xs text-slate-500">{threshold}</span>
            </div>
            <input
              id="threshold"
              type="range"
              min={40}
              max={220}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <p className="mt-1 text-xs text-slate-500">Higher removes more paper shadow and texture.</p>
          </div>

          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Background
            </span>
            <div className="flex gap-1 rounded-md bg-slate-100 p-1 dark:bg-slate-950">
              {(["white", "transparent"] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setBackground(b)}
                  className={`flex-1 rounded px-2 py-1 text-xs font-medium capitalize transition-colors ${
                    background === b
                      ? "bg-indigo-500 text-white"
                      : "text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Exact size (px)
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={16}
                value={targetW}
                onChange={(e) => setTargetW(Math.max(16, Number(e.target.value) || 16))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <span className="text-slate-400">×</span>
              <input
                type="number"
                min={16}
                value={targetH}
                onChange={(e) => setTargetH(Math.max(16, Number(e.target.value) || 16))}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">Match your exam portal's exact requirement.</p>
          </div>

          <div>
            <label htmlFor="sigTargetKb" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Target size (KB)
            </label>
            <input
              id="sigTargetKb"
              type="number"
              min={1}
              value={targetKb}
              onChange={(e) => setTargetKb(Math.max(1, Number(e.target.value) || 1))}
              disabled={background === "transparent"}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            {background === "transparent" && (
              <p className="mt-1 text-xs text-slate-500">PNG (needed for transparency) has no size knob.</p>
            )}
          </div>
        </div>

        {error && <Notice tone="error">{error}</Notice>}
      </aside>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_220px]">
          <div
            className="flex items-center justify-center overflow-hidden rounded-lg border border-slate-200 p-6 shadow-sm dark:border-slate-800"
            style={{
              backgroundColor: background === "white" ? "#fff" : undefined,
              backgroundImage:
                background === "transparent"
                  ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                  : undefined,
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
            }}
          >
            <canvas
              ref={canvasRef}
              role="img"
              aria-label="Preview of the cleaned signature"
              className="h-auto w-full"
            />
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Result</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-600 dark:text-slate-400">Size</dt>
                  <dd className="font-mono text-slate-900 dark:text-slate-100">
                    {result ? `${result.width}×${result.height}` : "…"}
                  </dd>
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
              {processing ? "Cleaning…" : unlocked ? "Download again" : "Watch ad to download — free"}
            </button>
          </div>
        </div>
      </div>

      {showAdGate && <AdGate onComplete={onAdComplete} onCancel={() => setShowAdGate(false)} />}
    </div>
  );
}
