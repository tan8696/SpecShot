"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { compressToQuality, formatFromMime, loadImageFile, type CompressFormat, type CompressResult } from "@/lib/engine/compress";
import {
  clampCropRect,
  clampCropRectToRatio,
  cropToCanvas,
  applyAspectLock,
  ASPECT_RATIOS,
  type AspectPreset,
} from "@/lib/engine/crop";
import { rotateCanvas, flipCanvas, straightenCanvas, type Rotation } from "@/lib/engine/rotate";
import type { CropRect } from "@/lib/engine/geometry";
import { withWatermark } from "@/lib/engine/watermark";
import { downloadBlob } from "@/lib/download";
import { stashHandoffImage } from "@/lib/handoff";
import { Notice } from "./Notice";
import { UploadScreen } from "./UploadScreen";
import { AdGate } from "./AdGate";
import { StatPill, StudioPrivacyNote, formatKb, STUDIO_FRAME } from "./studioUi";

type Step = "upload" | "configure";
type Handle = "move" | "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";
type Guide = "thirds" | "none";

const MIN_SIZE = 20;
const CORNERS: Handle[] = ["nw", "ne", "sw", "se"];
const FORMATS: CompressFormat[] = ["jpeg", "png", "webp"];

const PRESETS: { id: AspectPreset; label: string; hint: string }[] = [
  { id: "free", label: "Freeform", hint: "Unconstrained" },
  { id: "1:1", label: "1:1", hint: "Square post" },
  { id: "16:9", label: "16:9", hint: "Video / slide" },
  { id: "4:5", label: "4:5", hint: "Portrait post" },
  { id: "9:16", label: "9:16", hint: "Stories / Reels" },
  { id: "3:2", label: "3:2", hint: "35mm photo" },
  { id: "4:3", label: "4:3", hint: "Standard" },
  { id: "2:1", label: "2:1", hint: "Banner" },
];

const GUIDES: { id: Guide; label: string; icon: string }[] = [
  { id: "thirds", label: "Rule of thirds", icon: "grid_3x3" },
  { id: "none", label: "No overlay", icon: "visibility_off" },
];

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
  if (handle === "ne" || handle === "e" || handle === "se") w += dx;
  if (handle === "nw" || handle === "n" || handle === "ne") {
    y += dy;
    h -= dy;
  }
  if (handle === "sw" || handle === "s" || handle === "se") h += dy;
  return { x, y, w: Math.max(MIN_SIZE, w), h: Math.max(MIN_SIZE, h) };
}

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
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [format, setFormat] = useState<CompressFormat>("jpeg");

  const [rotation, setRotation] = useState<0 | Rotation>(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [straighten, setStraighten] = useState(0);
  const [working, setWorking] = useState<HTMLCanvasElement | null>(null);

  const [rect, setRect] = useState<CropRect | null>(null);
  const [preset, setPreset] = useState<AspectPreset>("free");
  const [guide, setGuide] = useState<Guide>("thirds");

  const [result, setResult] = useState<CompressResult | null>(null);
  const [encodeMs, setEncodeMs] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [showAdGate, setShowAdGate] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const stageCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgBoxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const workRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<{ handle: Handle; startRect: CropRect; startNatural: { x: number; y: number } } | null>(null);
  const [displayScale, setDisplayScale] = useState(0);

  async function onFile(f: File) {
    setError(null);
    setResult(null);
    try {
      const loaded = await loadImageFile(f);
      setFile(f);
      setImg(loaded);
      setFormat(formatFromMime(f.type));
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setStraighten(0);
      setPreset("free");
      setStep("configure");
    } catch {
      setError("Could not read that image file.");
    }
  }

  // Build the working canvas: source → 90° rotation → flips → straighten.
  // The crop rectangle lives in this canvas's pixel space. Lightly debounced
  // so dragging the straighten dial doesn't re-render on every tick.
  useEffect(() => {
    if (!img) return;
    if (workRef.current) clearTimeout(workRef.current);
    workRef.current = setTimeout(() => {
      let c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext("2d")!.drawImage(img, 0, 0);
      if (rotation) c = rotateCanvas(c, rotation);
      if (flipH) c = flipCanvas(c, "horizontal");
      if (flipV) c = flipCanvas(c, "vertical");
      if (straighten) c = straightenCanvas(c, straighten);
      setWorking(c);
    }, 60);
    return () => {
      if (workRef.current) clearTimeout(workRef.current);
    };
  }, [img, rotation, flipH, flipV, straighten]);

  // Reset the crop rect only when the frame orientation actually changes
  // (load, or a 90° rotation) — not for flips or straighten nudges.
  useEffect(() => {
    if (!img) return;
    const w = rotation % 180 === 0 ? img.naturalWidth : img.naturalHeight;
    const h = rotation % 180 === 0 ? img.naturalHeight : img.naturalWidth;
    setRect({ x: w * 0.1, y: h * 0.1, w: w * 0.8, h: h * 0.8 });
    setPreset("free");
  }, [img, rotation]);

  // Keep the rect inside the working canvas when straighten shrinks the frame.
  useEffect(() => {
    if (!working) return;
    setRect((r) => (r ? clampCropRect(r, working.width, working.height) : r));
  }, [working]);

  // Blit the working canvas into the on-screen stage canvas.
  useLayoutEffect(() => {
    const c = stageCanvasRef.current;
    if (!c || !working) return;
    c.width = working.width;
    c.height = working.height;
    c.getContext("2d")!.drawImage(working, 0, 0);
  }, [working]);

  // natural-px per CSS-px, for placing the overlay rect.
  useEffect(() => {
    if (!working || step !== "configure") return;
    const el = imgBoxRef.current;
    if (!el) return;
    const update = () => setDisplayScale(el.clientWidth / working.width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [working, step]);

  function applyPreset(p: AspectPreset) {
    setPreset(p);
    if (!working || !rect) return;
    if (p === "free") return;
    const ratio = ASPECT_RATIOS[p];
    const next = applyAspectLock(rect, ratio);
    setRect(clampCropRectToRatio(next, working.width, working.height, ratio));
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
    if (!drag || !working) return;
    const p = naturalPointFromEvent(e);
    const dx = p.x - drag.startNatural.x;
    const dy = p.y - drag.startNatural.y;
    const ratio = preset === "free" ? null : ASPECT_RATIOS[preset];
    const isCorner = (CORNERS as Handle[]).includes(drag.handle);
    const isEdgeLocked = ratio && !isCorner && drag.handle !== "move";
    if (isEdgeLocked) return;
    if (ratio && isCorner) {
      const candidate = lockedCornerResize(drag.startRect, drag.handle as (typeof CORNERS)[number], dx, ratio);
      setRect(clampCropRectToRatio(candidate, working.width, working.height, ratio));
    } else {
      const candidate = freeResize(drag.startRect, drag.handle, dx, dy);
      setRect(clampCropRect(candidate, working.width, working.height));
    }
  }

  function onHandleUp() {
    dragRef.current = null;
  }

  function setRectField(field: keyof CropRect, value: number) {
    if (!rect || !working) return;
    const edited = { ...rect, [field]: Math.max(0, value) };
    if (preset !== "free" && (field === "w" || field === "h")) {
      const ratio = ASPECT_RATIOS[preset];
      const locked = field === "w" ? applyAspectLock(edited, ratio) : { ...edited, w: Math.max(1, Math.round(edited.h * ratio)) };
      setRect(clampCropRectToRatio(locked, working.width, working.height, ratio));
    } else {
      setRect(clampCropRect(edited, working.width, working.height));
    }
  }

  function centerRect() {
    if (!rect || !working) return;
    setRect({ ...rect, x: (working.width - rect.w) / 2, y: (working.height - rect.h) / 2 });
  }

  function resetBounds() {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setStraighten(0);
    setPreset("free");
    if (img) setRect({ x: img.naturalWidth * 0.1, y: img.naturalHeight * 0.1, w: img.naturalWidth * 0.8, h: img.naturalHeight * 0.8 });
  }

  useEffect(() => {
    if (!working || !rect) return;
    setUnlocked(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setProcessing(true);
      setError(null);
      try {
        const canvas = cropToCanvas(working, rect);
        const t0 = performance.now();
        const r = await compressToQuality(canvas, format, 92);
        setEncodeMs(Math.round(performance.now() - t0));
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
  }, [working, rect, format]);

  useEffect(() => {
    if (!result) {
      setPreviewUrl(null);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    if (unlocked) {
      objectUrl = URL.createObjectURL(result.blob);
      setPreviewUrl(objectUrl);
    } else {
      const srcUrl = URL.createObjectURL(result.blob);
      const im = new Image();
      im.onload = () => {
        URL.revokeObjectURL(srcUrl);
        if (cancelled) return;
        const clean = document.createElement("canvas");
        clean.width = result.width;
        clean.height = result.height;
        clean.getContext("2d")!.drawImage(im, 0, 0);
        withWatermark(clean).toBlob((b) => {
          if (cancelled || !b) return;
          objectUrl = URL.createObjectURL(b);
          setPreviewUrl(objectUrl);
        }, "image/png");
      };
      im.src = srcUrl;
    }
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
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

  async function pipeToCompressor() {
    if (!result) return;
    const ext = format === "jpeg" ? "jpg" : format;
    const base = file?.name.replace(/\.[^.]+$/, "") || "image";
    const handoff = new File([result.blob], `${base}-cropped.${ext}`, { type: result.blob.type || `image/${format}` });
    await stashHandoffImage(handoff).catch(() => {});
    router.push("/app/?tool=compress");
  }

  function startOver() {
    setStep("upload");
    setFile(null);
    setImg(null);
    setWorking(null);
    setRect(null);
    setResult(null);
    setEncodeMs(null);
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
  const iconBtn =
    "flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface";
  const activeIconBtn = "flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary-fixed";

  const gw = working?.width ?? 0;
  const gh = working?.height ?? 0;
  const outW = result?.width ?? Math.round(rect?.w ?? 0);
  const outH = result?.height ?? Math.round(rect?.h ?? 0);

  return (
    <div className={STUDIO_FRAME}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button onClick={startOver} className="text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface">
          ← Choose a different photo
        </button>
        <button
          onClick={resetBounds}
          className="flex items-center gap-1.5 rounded-lg bg-surface-container px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-[16px]">restart_alt</span>
          Reset bounds
        </button>
      </div>

      {/* Telemetry bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">crop</span>
          <h2 className="font-display text-base font-semibold">Cropper</h2>
          <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[11px] text-secondary">
            {preset === "free" ? "FREE" : preset}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatPill icon="crop_free" label="Crop" value={`${outW}×${outH}`} tone="primary" />
          <StatPill icon="aspect_ratio" label="Ratio" value={outH ? (outW / outH).toFixed(2) : "—"} tone="secondary" />
          <StatPill icon="download" label="Output" value={result ? formatKb(result.blob.size / 1024) : "—"} />
          <StatPill icon="timer" label="Encoded" value={encodeMs != null ? `${encodeMs} ms` : "—"} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Stage */}
        <div className="space-y-3 lg:col-span-8">
          <div
            ref={imgBoxRef}
            className="relative mx-auto block max-w-full touch-none select-none overflow-hidden rounded-xl bg-black"
            onPointerMove={onHandleMove}
            onPointerUp={onHandleUp}
            onPointerCancel={onHandleUp}
          >
            <canvas ref={stageCanvasRef} className="block max-h-[62vh] w-full object-contain" aria-label="Crop stage" role="img" />

            {rect && displayScale > 0 && (
              <>
                {/* dark scrim outside the crop — a big spread-shadow, clipped
                    by the stage's overflow-hidden */}
                <div
                  className="pointer-events-none absolute"
                  style={{
                    boxShadow: "0 0 0 9999px rgba(14,14,16,0.62)",
                    left: rect.x * displayScale,
                    top: rect.y * displayScale,
                    width: rect.w * displayScale,
                    height: rect.h * displayScale,
                  }}
                />
                <div
                  className="absolute border border-primary/80"
                  style={{
                    left: rect.x * displayScale,
                    top: rect.y * displayScale,
                    width: rect.w * displayScale,
                    height: rect.h * displayScale,
                  }}
                  onPointerDown={(e) => onHandleDown("move", e)}
                >
                  <GuideLines guide={guide} />
                  {(Object.keys(HANDLE_POS) as Handle[])
                    .filter((h) => h !== "move")
                    .map((h) => {
                      const isCorner = (CORNERS as Handle[]).includes(h);
                      const disabled = ratioLocked && !isCorner;
                      const pos = HANDLE_POS[h];
                      return (
                        <div
                          key={h}
                          onPointerDown={(e) => {
                            if (disabled) return;
                            e.stopPropagation();
                            onHandleDown(h, e);
                          }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 ${
                            isCorner ? "h-3 w-3 rounded-[3px] bg-primary" : "bg-secondary"
                          } ${h === "n" || h === "s" ? "h-1.5 w-5 rounded-full" : ""} ${
                            h === "e" || h === "w" ? "h-5 w-1.5 rounded-full" : ""
                          } shadow-[0_0_8px_rgba(192,193,255,0.7)] ${disabled ? "opacity-25" : ""}`}
                          style={{ top: pos.top, left: pos.left, cursor: disabled ? "not-allowed" : pos.cursor }}
                        />
                      );
                    })}
                </div>
              </>
            )}

            {/* geometry dock */}
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl bg-surface-container-high/90 px-2 py-1.5 shadow-xl backdrop-blur-md">
              <button className={iconBtn} title="Rotate 90° left" onClick={() => setRotation((r) => (((r + 270) % 360) as 0 | Rotation))}>
                <span className="material-symbols-outlined text-[18px]">rotate_90_degrees_ccw</span>
              </button>
              <button className={iconBtn} title="Rotate 90° right" onClick={() => setRotation((r) => (((r + 90) % 360) as 0 | Rotation))}>
                <span className="material-symbols-outlined text-[18px]">rotate_90_degrees_cw</span>
              </button>
              <button className={flipH ? activeIconBtn : iconBtn} title="Flip horizontal" onClick={() => setFlipH((v) => !v)}>
                <span className="material-symbols-outlined text-[18px]">flip</span>
              </button>
              <button className={flipV ? activeIconBtn : iconBtn} title="Flip vertical" onClick={() => setFlipV((v) => !v)}>
                <span className="material-symbols-outlined rotate-90 text-[18px]">flip</span>
              </button>
              <div className="mx-1 flex items-center gap-2 rounded-lg bg-surface-container-low px-2 py-1">
                <span className="material-symbols-outlined text-[16px] text-secondary">straighten</span>
                <input
                  type="range"
                  min={-45}
                  max={45}
                  step={0.5}
                  value={straighten}
                  onChange={(e) => setStraighten(Number(e.target.value))}
                  className="h-1 w-24 accent-primary"
                  aria-label="Straighten angle"
                />
                <span className="w-10 font-mono text-[11px] text-secondary">{straighten.toFixed(1)}°</span>
              </div>
            </div>
          </div>

          {/* preview strip */}
          <div className="overflow-hidden rounded-xl bg-surface-container-low">
            <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-outline">
              <span>Result preview</span>
              <span className="font-mono">
                {gw} × {gh} working · {format === "jpeg" ? "JPG" : format.toUpperCase()} q92
              </span>
            </div>
            <div className="flex items-center justify-center bg-black p-3">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Cropped result" className="max-h-52 max-w-full object-contain" />
              ) : (
                <span className="py-8 text-sm text-outline">{processing ? "Cropping…" : "…"}</span>
              )}
            </div>
          </div>
        </div>

        {/* Inspector */}
        <div className="space-y-4 lg:col-span-4">
          <div className="rounded-xl bg-surface-container-low p-4">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-outline">Aspect ratio</span>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id)}
                  className={`flex flex-col items-start rounded-lg px-2.5 py-1.5 text-left transition-colors ${
                    preset === p.id ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="text-xs font-medium">{p.label}</span>
                  <span className={`text-[10px] ${preset === p.id ? "text-on-primary-container/70" : "text-outline"}`}>{p.hint}</span>
                </button>
              ))}
            </div>
            {ratioLocked && <p className="mt-2 text-[11px] text-outline">Ratio locked — drag a corner; edges are disabled.</p>}
          </div>

          <div className="rounded-xl bg-surface-container-low p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-outline">Exact bounds (px)</span>
              <button onClick={centerRect} className="flex items-center gap-1 text-[11px] text-secondary transition-colors hover:text-primary">
                <span className="material-symbols-outlined text-[13px]">filter_center_focus</span>
                Center
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["x", "y", "w", "h"] as const).map((f) => (
                <div key={f} className="rounded-lg bg-surface-container p-2">
                  <label htmlFor={`crop-${f}`} className="block text-[10px] uppercase tracking-wider text-outline">
                    {f === "x" ? "Left" : f === "y" ? "Top" : f === "w" ? "Width" : "Height"}
                  </label>
                  <input
                    id={`crop-${f}`}
                    type="number"
                    min={0}
                    value={rect ? Math.round(rect[f]) : 0}
                    onChange={(e) => setRectField(f, Number(e.target.value) || 0)}
                    className="w-full bg-transparent font-mono text-sm text-on-surface focus:text-primary focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-surface-container-low p-4">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-outline">Composition guide</span>
            <div className="grid grid-cols-2 gap-1.5">
              {GUIDES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGuide(g.id)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                    guide === g.id ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">{g.icon}</span>
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-surface-container-low p-4">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-outline">Output format</span>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-surface-container-lowest p-1">
              {FORMATS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`rounded px-2 py-1.5 text-xs font-medium uppercase transition-colors ${
                    format === f ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {f === "jpeg" ? "JPG" : f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => (unlocked ? onAdComplete() : setShowAdGate(true))}
              disabled={!result || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-[0_0_20px_-4px_rgba(192,193,255,0.5)] transition-colors hover:bg-primary-container hover:text-on-primary-container disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">crop</span>
              {processing ? "Cropping…" : unlocked ? `Download again (${formatKb((result?.blob.size ?? 0) / 1024)})` : "Watch ad to download — free"}
            </button>
            <button
              onClick={pipeToCompressor}
              disabled={!result}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-surface-container-high px-4 py-2 text-xs font-medium text-secondary transition-colors hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[16px]">compress</span>
              Send the crop to the compressor
            </button>
            <button
              onClick={resetBounds}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-surface-container px-3 py-2 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              Reset all bounds &amp; transforms
            </button>
          </div>
        </div>
      </div>

      <StudioPrivacyNote />

      {error && <Notice tone="error">{error}</Notice>}
      {showAdGate && <AdGate onComplete={onAdComplete} onCancel={() => setShowAdGate(false)} />}
    </div>
  );
}

function GuideLines({ guide }: { guide: Guide }) {
  if (guide === "none") return null;
  const line = "pointer-events-none absolute bg-primary/35";
  const at = ["33.333%", "66.667%"];
  return (
    <>
      {at.map((p) => (
        <div key={`v${p}`} className={line} style={{ left: p, top: 0, bottom: 0, width: 1 }} />
      ))}
      {at.map((p) => (
        <div key={`h${p}`} className={line} style={{ top: p, left: 0, right: 0, height: 1 }} />
      ))}
    </>
  );
}
