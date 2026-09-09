"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { compressToQuality, formatFromMime, loadImageFile, type CompressFormat, type CompressResult } from "@/lib/engine/compress";
import { clampCropRect, clampCropRectToRatio, cropToCanvas, applyAspectLock, ASPECT_RATIOS, type AspectPreset } from "@/lib/engine/crop";
import type { CropRect } from "@/lib/engine/geometry";
import { withWatermark } from "@/lib/engine/watermark";
import { downloadBlob } from "@/lib/download";
import { Notice } from "./Notice";
import { UploadScreen } from "./UploadScreen";
import { AdGate } from "./AdGate";

type Step = "upload" | "configure";
type Handle = "move" | "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

const MIN_SIZE = 20; // natural px — never let the rect collapse to nothing
const CORNERS: Handle[] = ["nw", "ne", "sw", "se"];
const PRESETS: AspectPreset[] = ["free", "1:1", "4:3", "3:2", "16:9"];

/** Free-drag delta applied to a rect from its state *at drag start* — every
 * handle just says which edges move. Aspect-lock correction (corners only,
 * see CropTool below) is layered on top of this, not folded in here. */
function freeResize(start: CropRect, handle: Handle, dx: number, dy: number): CropRect {
  let { x, y, w, h } = start;
  if (handle === "move") {
    x += dx;
    y += dy;
  }
  if (handle === "nw" || handle === "w" || handle === "sw") {
    x += dx;
    w -= dx;
  }
  if (handle === "ne" || handle === "e" || handle === "se") {
    w += dx;
  }
  if (handle === "nw" || handle === "n" || handle === "ne") {
    y += dy;
    h -= dy;
  }
  if (handle === "sw" || handle === "s" || handle === "se") {
    h += dy;
  }
  return { x, y, w: Math.max(MIN_SIZE, w), h: Math.max(MIN_SIZE, h) };
}

/** Corner-handle resize with the ratio preserved and the opposite corner
 * held fixed — e.g. dragging the top-left handle keeps the bottom-right
 * corner exactly where it was. Edge handles don't get an aspect-lock
 * behavior of their own (see the render below: they're disabled when a
 * ratio is locked) — resizing only one dimension while locked has no
 * unambiguous meaning without picking an arbitrary anchor policy. */
function lockedCornerResize(start: CropRect, handle: (typeof CORNERS)[number], dx: number, ratio: number): CropRect {
  const free = freeResize(start, handle, dx, 0);
  const w = free.w;
  const h = Math.max(MIN_SIZE, w / ratio);
  const right = start.x + start.w;
  const bottom = start.y + start.h;
  const x = handle === "nw" || handle === "sw" ? right - w : start.x;
  const y = handle === "nw" || handle === "ne" ? bottom - h : start.y;
  return { x, y, w, h };
}

export function CropTool() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [format, setFormat] = useState<CompressFormat>("jpeg");
  const [rect, setRect] = useState<CropRect | null>(null);
  const [preset, setPreset] = useState<AspectPreset>("free");
  const [result, setResult] = useState<CompressResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [showAdGate, setShowAdGate] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgBoxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<{ handle: Handle; startRect: CropRect; startNatural: { x: number; y: number } } | null>(null);
  const [displayScale, setDisplayScale] = useState(1);

  async function onFile(f: File) {
    setError(null);
    setResult(null);
    try {
      const loaded = await loadImageFile(f);
      setFile(f);
      setImg(loaded);
      setFormat(formatFromMime(f.type));
      // An 80%-centered inset, not the full image — makes it obvious
      // there's a rect to drag rather than looking like nothing happened.
      setRect({ x: loaded.naturalWidth * 0.1, y: loaded.naturalHeight * 0.1, w: loaded.naturalWidth * 0.8, h: loaded.naturalHeight * 0.8 });
      setPreset("free");
      setStep("configure");
    } catch {
      setError("Could not read that image file.");
    }
  }

  // Keeps displayScale (natural px -> rendered CSS px) correct across window
  // resizes, since the overlay rect is positioned in CSS px derived from it.
  useEffect(() => {
    if (!img || step !== "configure") return;
    const el = imgBoxRef.current;
    if (!el) return;
    const update = () => setDisplayScale(el.clientWidth / img.naturalWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [img, step]);

  function applyPreset(p: AspectPreset) {
    setPreset(p);
    if (!img || !rect) return;
    if (p === "free") return;
    const ratio = ASPECT_RATIOS[p];
    const next = applyAspectLock(rect, ratio);
    setRect(clampCropRectToRatio(next, img.naturalWidth, img.naturalHeight, ratio));
  }

  function naturalPointFromEvent(e: React.PointerEvent) {
    const el = imgBoxRef.current!;
    const box = el.getBoundingClientRect();
    return { x: (e.clientX - box.left) / displayScale, y: (e.clientY - box.top) / displayScale };
  }

  function onHandleDown(handle: Handle, e: React.PointerEvent) {
    if (!rect) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { handle, startRect: rect, startNatural: naturalPointFromEvent(e) };
  }

  function onHandleMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || !img) return;
    const p = naturalPointFromEvent(e);
    const dx = p.x - drag.startNatural.x;
    const dy = p.y - drag.startNatural.y;
    const ratio = preset === "free" ? null : ASPECT_RATIOS[preset];
    const isCorner = (CORNERS as Handle[]).includes(drag.handle);
    const isEdgeLocked = ratio && !isCorner && drag.handle !== "move";
    if (isEdgeLocked) return; // see lockedCornerResize's doc comment
    if (ratio && isCorner) {
      const candidate = lockedCornerResize(drag.startRect, drag.handle as (typeof CORNERS)[number], dx, ratio);
      setRect(clampCropRectToRatio(candidate, img.naturalWidth, img.naturalHeight, ratio));
    } else {
      const candidate = freeResize(drag.startRect, drag.handle, dx, dy);
      setRect(clampCropRect(candidate, img.naturalWidth, img.naturalHeight));
    }
  }

  function onHandleUp() {
    dragRef.current = null;
  }

  function setRectField(field: keyof CropRect, value: number) {
    if (!rect || !img) return;
    const edited = { ...rect, [field]: Math.max(0, value) };
    // Typing a width/height while a ratio is locked re-derives the other
    // dimension, same as the corner-drag path — editing x/y is just a move.
    if (preset !== "free" && (field === "w" || field === "h")) {
      const ratio = ASPECT_RATIOS[preset];
      const locked = field === "w" ? applyAspectLock(edited, ratio) : { ...edited, w: Math.max(1, Math.round(edited.h * ratio)) };
      setRect(clampCropRectToRatio(locked, img.naturalWidth, img.naturalHeight, ratio));
    } else {
      setRect(clampCropRect(edited, img.naturalWidth, img.naturalHeight));
    }
  }

  useEffect(() => {
    if (!img || !rect) return;
    setUnlocked(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setProcessing(true);
      setError(null);
      try {
        const canvas = cropToCanvas(img, rect);
        const r = await compressToQuality(canvas, format, 92);
        setResult(r);
      } catch {
        setError("Could not crop that image.");
      } finally {
        setProcessing(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [img, rect, format]);

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
    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    downloadBlob(result.blob, `${base}-cropped.${ext}`);
  }

  function startOver() {
    setStep("upload");
    setFile(null);
    setImg(null);
    setRect(null);
    setResult(null);
    setUnlocked(false);
    setError(null);
  }

  if (step === "upload") {
    return (
      <>
        <UploadScreen
          onFile={onFile}
          heading="Crop an image"
          subheading="Drag the selection, or type exact numbers — entirely in your browser."
          hint="Any JPEG, PNG, or WebP"
        />
        {error && <Notice tone="error">{error}</Notice>}
      </>
    );
  }

  const ratioLocked = preset !== "free";
  const HANDLE_POS: Record<Handle, { top: string; left: string; cursor: string }> = {
    nw: { top: "0%", left: "0%", cursor: "nwse-resize" },
    n: { top: "0%", left: "50%", cursor: "ns-resize" },
    ne: { top: "0%", left: "100%", cursor: "nesw-resize" },
    e: { top: "50%", left: "100%", cursor: "ew-resize" },
    se: { top: "100%", left: "100%", cursor: "nwse-resize" },
    s: { top: "100%", left: "50%", cursor: "ns-resize" },
    sw: { top: "100%", left: "0%", cursor: "nesw-resize" },
    w: { top: "50%", left: "0%", cursor: "ew-resize" },
    move: { top: "50%", left: "50%", cursor: "move" },
  };

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
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Aspect ratio
            </span>
            <div className="flex flex-wrap gap-1">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => applyPreset(p)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                    preset === p
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            {ratioLocked && (
              <p className="mt-1 text-xs text-slate-500">Drag a corner to resize — edges are disabled while a ratio is locked.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(["x", "y", "w", "h"] as const).map((f) => (
              <div key={f}>
                <label htmlFor={`crop-${f}`} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                  {f === "x" ? "Left" : f === "y" ? "Top" : f === "w" ? "Width" : "Height"}
                </label>
                <input
                  id={`crop-${f}`}
                  type="number"
                  min={0}
                  value={rect ? Math.round(rect[f]) : 0}
                  onChange={(e) => setRectField(f, Number(e.target.value) || 0)}
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Result</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600 dark:text-slate-400">Cropped size</dt>
              <dd className="font-mono text-slate-900 dark:text-slate-100">{result ? `${result.width}×${result.height}` : "…"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600 dark:text-slate-400">File size</dt>
              <dd className="font-mono text-slate-900 dark:text-slate-100">{result ? `${(result.blob.size / 1024).toFixed(1)}KB` : "…"}</dd>
            </div>
          </dl>
        </div>

        <button
          onClick={() => (unlocked ? onAdComplete() : setShowAdGate(true))}
          disabled={!result || processing}
          className="w-full rounded-md bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {processing ? "Cropping…" : unlocked ? "Download again" : "Watch ad to download — free"}
        </button>

        {error && <Notice tone="error">{error}</Notice>}
      </aside>

      <div className="space-y-4">
        <div
          ref={imgBoxRef}
          className="relative inline-block max-w-full select-none overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800"
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
        >
          {img && <img src={img.src} alt="" className="block max-h-[70vh] w-full" draggable={false} />}
          {rect && displayScale > 0 && (
            <div
              className="absolute border-2 border-indigo-400 bg-indigo-400/10"
              style={{
                left: rect.x * displayScale,
                top: rect.y * displayScale,
                width: rect.w * displayScale,
                height: rect.h * displayScale,
              }}
              onPointerDown={(e) => onHandleDown("move", e)}
            >
              {(Object.keys(HANDLE_POS) as Handle[])
                .filter((h) => h !== "move")
                .map((h) => {
                  const disabled = ratioLocked && !(CORNERS as Handle[]).includes(h);
                  const pos = HANDLE_POS[h];
                  return (
                    <div
                      key={h}
                      onPointerDown={(e) => {
                        if (disabled) return;
                        e.stopPropagation();
                        onHandleDown(h, e);
                      }}
                      className={`absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-indigo-500 shadow ${
                        disabled ? "opacity-30" : ""
                      }`}
                      style={{ top: pos.top, left: pos.left, cursor: disabled ? "not-allowed" : pos.cursor }}
                    />
                  );
                })}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <canvas ref={canvasRef} role="img" aria-label="Preview of the cropped result" className="h-auto max-h-64 w-full object-contain" />
        </div>
      </div>

      {showAdGate && <AdGate onComplete={onAdComplete} onCancel={() => setShowAdGate(false)} />}
    </div>
  );
}
