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
import { StudioPrivacyNote, STUDIO_FRAME } from "./studioUi";

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
              className="flex items-center gap-1.5 text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
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
      <div className={`mx-auto max-w-xl ${STUDIO_FRAME}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">badge</span>
            <h2 className="font-display text-base font-semibold">ID Photo</h2>
          </div>
          <div className="flex min-w-0 items-center gap-2 text-xs text-on-surface-variant">
            <span className="truncate font-mono">{file?.name}</span>
            <button onClick={() => setStep("upload")} className="shrink-0 rounded-lg bg-surface-container px-2 py-1 font-medium text-secondary transition-colors hover:bg-surface-container-high">
              Change
            </button>
          </div>
        </div>

        <div className="space-y-4 rounded-xl bg-surface-container-low p-4">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-outline">Choose your document</span>
          <SpecPicker specs={specs} slug={slug} onChange={setSlug} />

          {otherSpecs.length > 0 && (
            <div className="border-t border-outline-variant/30 pt-4">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-outline">Also generate</span>
              <p className="mt-1 mb-2 text-[11px] text-outline">One photo, several documents at once.</p>
              <div className="space-y-1.5">
                {otherSpecs.map((s) => (
                  <label key={s.slug} className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <input
                      type="checkbox"
                      checked={extraSlugs.includes(s.slug)}
                      onChange={() => toggleExtra(s.slug)}
                      className="accent-primary"
                    />
                    {s.country} — {s.document}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={startProcessing}
          disabled={!spec}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-on-primary shadow-[0_0_20px_-4px_rgba(192,193,255,0.5)] transition-colors hover:bg-primary-container hover:text-on-primary-container disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          Create my photo
        </button>

        <StudioPrivacyNote />
      </div>
    );
  }

  return (
    <div className={STUDIO_FRAME}>
      <button onClick={startOver} className="text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface">
        ← Start over
      </button>
      {progressText && <Notice tone="info">{progressText}</Notice>}
      {jobs.length > 0 && (
        <div className={jobs.length > 1 ? "grid grid-cols-1 gap-4 xl:grid-cols-2" : "grid grid-cols-1 gap-4"}>
          {jobs.map((job) => (
            <ResultCard key={job.spec.slug} spec={job.spec} result={job.result} error={job.error} status={job.status} />
          ))}
        </div>
      )}
      <StudioPrivacyNote />
    </div>
  );
}
