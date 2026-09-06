"use client";

import { useState } from "react";
import type { Spec } from "@/lib/specs";
import {
  processPhoto,
  RetakeError,
  NoFaceError,
  type ProgressStage,
  type PipelineResult,
} from "@/lib/engine/pipeline";
import { SpecPicker } from "./SpecPicker";
import { CameraCapture } from "./CameraCapture";
import { Notice } from "./Notice";
import { ResultCard, type JobStatus } from "./ResultCard";
import { UploadScreen } from "./UploadScreen";

const PROGRESS_LABEL: Record<ProgressStage, string> = {
  "loading-image": "Reading your photo…",
  "detecting-face": "Finding your face…",
  leveling: "Leveling…",
  "removing-background": "Isolating your head from the background…",
  cropping: "Measuring and cropping…",
  verifying: "Re-measuring the finished file…",
  encoding: "Compressing to size…",
};

type Step = "upload" | "configure" | "result";
type Job = { spec: Spec; result: PipelineResult | null; error: string | null; status: JobStatus };

export function PhotoTool({ specs, initialSlug }: { specs: Spec[]; initialSlug?: string }) {
  const [slug, setSlug] = useState(
    initialSlug && specs.some((s) => s.slug === initialSlug) ? initialSlug : (specs[0]?.slug ?? "")
  );
  const [extraSlugs, setExtraSlugs] = useState<string[]>([]);
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showCamera, setShowCamera] = useState(false);

  const spec = specs.find((s) => s.slug === slug) ?? null;
  const otherSpecs = specs.filter((s) => s.slug !== slug);

  function toggleExtra(extraSlug: string) {
    setExtraSlugs((prev) => (prev.includes(extraSlug) ? prev.filter((s) => s !== extraSlug) : [...prev, extraSlug]));
  }

  function onUploaded(f: File) {
    setFile(f);
    setStep("configure");
  }

  async function startProcessing() {
    if (!spec || !file) return;
    const targets = [spec, ...specs.filter((s) => extraSlugs.includes(s.slug))];
    setStep("result");
    setJobs(targets.map((s) => ({ spec: s, result: null, error: null, status: "pending" })));

    for (const target of targets) {
      setJobs((prev) => prev.map((j) => (j.spec.slug === target.slug ? { ...j, status: "processing" } : j)));
      try {
        const r = await processPhoto(file, target, (p) => setProgressText(`${target.document}: ${PROGRESS_LABEL[p]}`));
        setJobs((prev) => prev.map((j) => (j.spec.slug === target.slug ? { ...j, result: r, status: "done" } : j)));
      } catch (err) {
        if (!(err instanceof RetakeError || err instanceof NoFaceError)) console.error("[processPhoto]", err);
        const message =
          err instanceof RetakeError || err instanceof NoFaceError
            ? err.message
            : "Something went wrong processing that photo.";
        setJobs((prev) => prev.map((j) => (j.spec.slug === target.slug ? { ...j, error: message, status: "error" } : j)));
      }
    }
    setProgressText(null);
  }

  function startOver() {
    setStep("upload");
    setFile(null);
    setJobs([]);
    setProgressText(null);
  }

  if (step === "upload") {
    return (
      <>
        <UploadScreen
          onFile={onUploaded}
          heading="Create your ID photo"
          subheading="Upload a selfie to get started — measured and cropped entirely in your browser."
          hint="Front-facing, plain background, good lighting"
          extraAction={
            <button
              onClick={() => setShowCamera(true)}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 8a2 2 0 012-2h2l1.5-2h7L17 6h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              Use camera instead
            </button>
          }
        />
        {specs.length === 0 && <Notice tone="error">No verified specs are available yet.</Notice>}
        {showCamera && (
          <CameraCapture
            onCapture={(f) => {
              setShowCamera(false);
              onUploaded(f);
            }}
            onClose={() => setShowCamera(false)}
          />
        )}
      </>
    );
  }

  if (step === "configure") {
    return (
      <div className="mx-auto max-w-xl py-10">
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="9" cy="10" r="1.5" />
              <path d="M21 16l-5.5-5.5L3 20" />
            </svg>
          </div>
          <div className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
            {file?.name}
          </div>
          <button
            onClick={() => setStep("upload")}
            className="shrink-0 text-sm font-medium text-indigo-600 dark:text-indigo-400"
          >
            Change
          </button>
        </div>

        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Choose your document</h2>
        <SpecPicker specs={specs} slug={slug} onChange={setSlug} />

        {otherSpecs.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">Also generate</h2>
            <p className="mb-3 text-xs text-slate-500">One photo, several documents at once.</p>
            <div className="space-y-2">
              {otherSpecs.map((s) => (
                <label key={s.slug} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={extraSlugs.includes(s.slug)}
                    onChange={() => toggleExtra(s.slug)}
                    className="accent-indigo-500"
                  />
                  {s.country} — {s.document}
                </label>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={startProcessing}
          disabled={!spec}
          className="mt-8 w-full rounded-md bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Create my photo
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={startOver}
        className="mb-4 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      >
        ← Start over
      </button>
      {progressText && (
        <div className="mb-4">
          <Notice tone="info">{progressText}</Notice>
        </div>
      )}
      {jobs.length > 0 && (
        <div className={jobs.length > 1 ? "grid grid-cols-1 gap-4 xl:grid-cols-2" : "grid grid-cols-1 gap-4"}>
          {jobs.map((job) => (
            <ResultCard key={job.spec.slug} spec={job.spec} result={job.result} error={job.error} status={job.status} />
          ))}
        </div>
      )}
    </div>
  );
}
