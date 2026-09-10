"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { imagesToPdf, type PageMode } from "@/lib/engine/pdf";
import { downloadBlob } from "@/lib/download";
import { Notice } from "./Notice";
import { UploadScreen } from "./UploadScreen";
import { AdGate } from "./AdGate";
import { StatPill, StudioPrivacyNote, STUDIO_FRAME } from "./studioUi";

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
    <div className={STUDIO_FRAME}>
      <button onClick={startOver} className="text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface">
        ← Start over
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
          <h2 className="font-display text-base font-semibold">Images → PDF</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatPill icon="description" label="Pages" value={String(files.length)} tone="primary" />
          <StatPill icon="aspect_ratio" label="Size" value={MODE_LABELS[mode]} tone="secondary" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="rounded-xl bg-surface-container-low p-3">
            <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {thumbs.map((t, i) => (
                <li key={t.url} className="overflow-hidden rounded-lg border border-outline-variant/25 bg-surface-container-lowest">
                  <div className="flex aspect-square items-center justify-center bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.url} alt={`Page ${i + 1}`} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="flex items-center justify-between gap-1 p-1.5">
                    <span className="truncate font-mono text-[11px] text-outline" title={t.name}>
                      {i + 1}. {t.name}
                    </span>
                    <span className="flex shrink-0 text-on-surface-variant">
                      <button onClick={() => move(i, -1)} aria-label="Move up" className="px-1 transition-colors hover:text-on-surface">
                        <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                      </button>
                      <button onClick={() => move(i, 1)} aria-label="Move down" className="px-1 transition-colors hover:text-on-surface">
                        <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                      </button>
                      <button onClick={() => remove(i)} aria-label="Remove" className="px-1 transition-colors hover:text-amber-400">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <div className="space-y-4 rounded-xl bg-surface-container-low p-4">
            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-outline">Page size</span>
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-surface-container-lowest p-1">
                {(["image", "a4", "letter"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMode(m);
                      setUnlocked(false);
                      setPdf(null);
                    }}
                    className={`rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                      mode === m ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {MODE_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => addInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-surface-container px-3 py-2 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
              Add more images
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
          </div>

          <button
            onClick={() => (unlocked ? onAdComplete() : setShowAdGate(true))}
            disabled={files.length === 0 || generating}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-[0_0_20px_-4px_rgba(192,193,255,0.5)] transition-colors hover:bg-primary-container hover:text-on-primary-container disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            {generating ? "Building PDF…" : unlocked ? "Download PDF again" : "Watch ad to create the PDF — free"}
          </button>
        </div>
      </div>

      <StudioPrivacyNote />
      {error && <Notice tone="error">{error}</Notice>}
      {showAdGate && <AdGate onComplete={onAdComplete} onCancel={() => setShowAdGate(false)} />}
    </div>
  );
}
