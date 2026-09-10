"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { imagesToPdf, type PageMode } from "@/lib/engine/pdf";
import { downloadBlob } from "@/lib/download";
import { Notice } from "./Notice";
import { UploadScreen } from "./UploadScreen";
import { AdGate } from "./AdGate";

type Step = "upload" | "configure";

const MODE_LABELS: Record<PageMode, string> = { image: "Fit to image", a4: "A4", letter: "Letter" };
const MAX_FILES = 50;

/** Several images -> one PDF, one image per page. Multi-file, so it uses
 * UploadScreen's onFiles path. Nothing to watermark here — the source
 * images are the user's own; the gated deliverable is the assembled PDF,
 * which just isn't generated until the ad is watched. */
export function ImageToPdfTool({ accept = "image/jpeg" }: { accept?: string }) {
  const [step, setStep] = useState<Step>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<PageMode>("image");
  const [pdf, setPdf] = useState<Blob | null>(null);
  const [generating, setGenerating] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [showAdGate, setShowAdGate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  const thumbs = useMemo(() => files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })), [files]);
  useEffect(() => () => thumbs.forEach((t) => URL.revokeObjectURL(t.url)), [thumbs]);

  function reset(next: File[]) {
    setFiles(next);
    setUnlocked(false);
    setPdf(null);
    setError(null);
  }

  function onFiles(list: File[]) {
    reset(list.slice(0, MAX_FILES));
    setStep("configure");
  }

  function addMore(list: FileList | null) {
    if (!list) return;
    reset([...files, ...Array.from(list)].slice(0, MAX_FILES));
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= files.length) return;
    const next = [...files];
    [next[i], next[j]] = [next[j], next[i]];
    reset(next);
  }

  function remove(i: number) {
    reset(files.filter((_, k) => k !== i));
  }

  async function onAdComplete() {
    setShowAdGate(false);
    setGenerating(true);
    setError(null);
    try {
      const blob = pdf ?? (await imagesToPdf(files, mode));
      setPdf(blob);
      setUnlocked(true);
      downloadBlob(blob, "images.pdf");
    } catch {
      setError("Could not build the PDF from those images.");
    } finally {
      setGenerating(false);
    }
  }

  function startOver() {
    setStep("upload");
    reset([]);
  }

  if (step === "upload") {
    return (
      <>
        <UploadScreen
          onFiles={onFiles}
          heading="Images to PDF"
          subheading="Combine several photos into a single PDF, one per page — entirely in your browser."
          hint="Pick several JPG or PNG files at once"
          accept={accept}
          selectLabel="Select photos"
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
          ← Start over
        </button>

        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Page size
            </span>
            <div className="flex gap-1 rounded-md bg-slate-100 p-1 dark:bg-slate-950">
              {(["image", "a4", "letter"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setUnlocked(false);
                    setPdf(null);
                  }}
                  className={`flex-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                    mode === m
                      ? "bg-indigo-500 text-white"
                      : "text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">Pages</span>
            <span className="font-mono text-slate-900 dark:text-slate-100">{files.length}</span>
          </div>

          <button
            onClick={() => addInputRef.current?.click()}
            className="w-full rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            + Add more images
          </button>
          <input
            ref={addInputRef}
            type="file"
            accept={accept}
            multiple
            className="sr-only"
            onChange={(e) => {
              addMore(e.target.files);
              e.target.value = "";
            }}
          />

          <button
            onClick={() => (unlocked ? onAdComplete() : setShowAdGate(true))}
            disabled={files.length === 0 || generating}
            className="w-full rounded-md bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? "Building PDF…" : unlocked ? "Download PDF again" : "Watch ad to create PDF — free"}
          </button>
        </div>

        {error && <Notice tone="error">{error}</Notice>}
      </aside>

      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {thumbs.map((t, i) => (
          <li key={t.url} className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex aspect-square items-center justify-center bg-slate-50 dark:bg-slate-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.url} alt={`Page ${i + 1}`} className="max-h-full max-w-full object-contain" />
            </div>
            <div className="flex items-center justify-between gap-1 p-1.5">
              <span className="truncate text-[11px] text-slate-500" title={t.name}>
                {i + 1}. {t.name}
              </span>
              <span className="flex shrink-0">
                <button onClick={() => move(i, -1)} aria-label="Move up" className="px-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                  ↑
                </button>
                <button onClick={() => move(i, 1)} aria-label="Move down" className="px-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                  ↓
                </button>
                <button onClick={() => remove(i)} aria-label="Remove" className="px-1 text-slate-400 hover:text-red-600">
                  ✕
                </button>
              </span>
            </div>
          </li>
        ))}
      </ol>

      {showAdGate && <AdGate onComplete={onAdComplete} onCancel={() => setShowAdGate(false)} />}
    </div>
  );
}
