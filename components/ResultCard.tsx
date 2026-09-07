"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { Spec } from "@/lib/specs";
import type { PipelineResult, Measurements } from "@/lib/engine/pipeline";
import { planPrintSheet, renderPrintSheet, type SheetSize } from "@/lib/engine/printsheet";
import { downloadBlob } from "@/lib/download";
import { ComplianceChecklist } from "./ComplianceChecklist";
import { AdGate } from "./AdGate";
import { Notice } from "./Notice";

export type JobStatus = "pending" | "processing" | "done" | "error";

/**
 * One document's result — preview, guides, checklist, and its own
 * independent ad-gated download. Extracted so batch mode (lib/engine's
 * multi-spec run in PhotoTool) can render N of these side by side instead of
 * duplicating this whole block per job.
 */
export function ResultCard({
  spec,
  result,
  error,
  status,
}: {
  spec: Spec;
  result: PipelineResult | null;
  error: string | null;
  status: JobStatus;
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [showAdGate, setShowAdGate] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  const [sheetSize, setSheetSize] = useState<SheetSize>("4x6");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sheetPlan = planPrintSheet(sheetSize, spec.digital.width_px, spec.digital.height_px, spec.print.dpi);

  useLayoutEffect(() => {
    if (!result || !canvasRef.current) return;
    const c = canvasRef.current;
    const src = unlocked ? result.finalCanvas : result.previewCanvas;
    c.width = src.width;
    c.height = src.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(src, 0, 0);
    if (showGuides && result.measurements) drawGuides(ctx, result.measurements, spec, c.width, c.height);
  }, [result, unlocked, showGuides, spec]);

  function downloadPreview() {
    if (!result) return;
    result.previewCanvas.toBlob(
      (blob) => {
        if (blob) downloadBlob(blob, `${spec.slug}-watermarked.jpg`);
      },
      "image/jpeg",
      0.85
    );
  }

  function onAdComplete() {
    if (!result) return;
    setShowAdGate(false);
    setUnlocked(true);
    downloadBlob(result.blob, `${spec.slug}.${spec.digital.format === "png" ? "png" : "jpg"}`);
  }

  async function downloadPrintSheet() {
    if (!result) return;
    const blob = await renderPrintSheet(result.finalCanvas, sheetSize, spec.print.dpi);
    downloadBlob(blob, `${spec.slug}-print-sheet-${sheetSize}.jpg`);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        {spec.country} — {spec.document}
      </h3>

      {(status === "pending" || status === "processing") && (
        <div className="flex h-40 items-center justify-center rounded-md bg-slate-50 text-sm text-slate-500 dark:bg-slate-950">
          {status === "processing" ? "Processing…" : "Waiting…"}
        </div>
      )}

      {status === "error" && <Notice tone="error">{error ?? "Something went wrong with this one."}</Notice>}

      {result && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px]">
          <div>
            <div className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-800">
              <canvas
                ref={canvasRef}
                role="img"
                aria-label={`Preview of your ${spec.country} ${spec.document.toLowerCase()} photo result`}
                className="h-auto w-full"
              />
            </div>
            {result.measurements && (
              <label className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={showGuides}
                  onChange={(e) => setShowGuides(e.target.checked)}
                  className="accent-indigo-500"
                />
                Guides
              </label>
            )}
            {result.crownEstimated && (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">Crown position estimated.</p>
            )}
          </div>

          <div className="space-y-2">
            <ComplianceChecklist checks={result.checks} allPassed={result.allPassed} />
            <button
              onClick={downloadPreview}
              className="w-full rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              Watermarked preview
            </button>
            <button
              onClick={() => (unlocked ? onAdComplete() : setShowAdGate(true))}
              className="w-full rounded-md bg-indigo-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-400"
            >
              {unlocked ? "Download again" : "Watch ad — free"}
            </button>

            {unlocked && (
              <div className="space-y-2 border-t border-slate-200 pt-2 dark:border-slate-800">
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  Print sheet
                </span>
                <div className="flex gap-1 rounded-md bg-slate-100 p-1 dark:bg-slate-950">
                  {(["4x6", "a4"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSheetSize(s)}
                      className={`flex-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                        sheetSize === s
                          ? "bg-indigo-500 text-white"
                          : "text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
                      }`}
                    >
                      {s === "4x6" ? "4×6 in" : "A4"}
                    </button>
                  ))}
                </div>
                <button
                  onClick={downloadPrintSheet}
                  disabled={sheetPlan.count === 0}
                  className="w-full rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                >
                  Download print sheet ({sheetPlan.count} {sheetPlan.count === 1 ? "copy" : "copies"})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showAdGate && <AdGate onComplete={onAdComplete} onCancel={() => setShowAdGate(false)} />}
    </div>
  );
}

/** Draws the crown/eye/chin lines the compliance numbers are computed from,
 * plus the acceptable target band for crown and eye position — "the
 * interface is a measuring instrument that shows its work." A failed check
 * becomes a line visibly outside its shaded band, not just a number. */
function drawGuides(
  ctx: CanvasRenderingContext2D,
  m: NonNullable<Measurements>,
  spec: Spec,
  width: number,
  height: number
) {
  const ppm = spec.print.dpi / 25.4;

  const crownBandTop = m.chinY - spec.head.height_mm_max * ppm;
  const crownBandBottom = m.chinY - spec.head.height_mm_min * ppm;
  const eyeBandTop = height * (1 - spec.eye_line.from_bottom_pct_max / 100);
  const eyeBandBottom = height * (1 - spec.eye_line.from_bottom_pct_min / 100);

  ctx.save();
  drawBand(ctx, crownBandTop, crownBandBottom, width, "#22d3ee");
  drawBand(ctx, eyeBandTop, eyeBandBottom, width, "#facc15");

  const lines: [number, string, string][] = [
    [m.crownY, "Crown", "#22d3ee"],
    [m.eyeY, "Eye line", "#facc15"],
    [m.chinY, "Chin", "#f472b6"],
  ];
  ctx.font = "bold 12px sans-serif";
  ctx.textBaseline = "middle";
  for (const [y, label, color] of lines) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();

    const textWidth = ctx.measureText(label).width;
    ctx.fillStyle = color;
    ctx.fillRect(4, y - 9, textWidth + 8, 18);
    ctx.fillStyle = "#0b1120";
    ctx.fillText(label, 8, y);
  }
  ctx.restore();
}

function drawBand(ctx: CanvasRenderingContext2D, top: number, bottom: number, width: number, color: string) {
  ctx.setLineDash([]);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.12;
  ctx.fillRect(0, top, width, bottom - top);
  ctx.globalAlpha = 1;
}
