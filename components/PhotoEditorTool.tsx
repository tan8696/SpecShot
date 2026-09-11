"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { compressToQuality, drawResized, formatFromMime, loadImageFile, type CompressFormat, type CompressResult } from "@/lib/engine/compress";
import { rotateCanvas, flipCanvas } from "@/lib/engine/rotate";
import { buildFilterString, FILTER_PRESETS, type FilterPreset } from "@/lib/engine/editor";
import { wrapText, drawTextBlock } from "@/lib/engine/textlayer";
import { withWatermark } from "@/lib/engine/watermark";
import { downloadBlob } from "@/lib/download";
import { stashHandoffImage, takeHandoffImage } from "@/lib/handoff";
import { Notice } from "./Notice";
import { UploadScreen } from "./UploadScreen";
import { AdGate } from "./AdGate";
import { StatPill, StudioPrivacyNote, CanvasLoading, formatKb, STUDIO_FRAME } from "./studioUi";

type Step = "upload" | "configure";
type TextPos = "top" | "center" | "bottom";

function Slider({ id, label, value, set, min = 50, max = 150 }: { id: string; label: string; value: number; set: (n: number) => void; min?: number; max?: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-medium text-on-surface">
          {label}
        </label>
        <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[11px] text-secondary">{value}%</span>
      </div>
      <input id={id} type="range" min={min} max={max} value={value} onChange={(e) => set(Number(e.target.value))} className="w-full accent-primary" />
    </div>
  );
}

export function PhotoEditorTool() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [format, setFormat] = useState<CompressFormat>("jpeg");

  const [preset, setPreset] = useState<FilterPreset>("none");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [borderW, setBorderW] = useState(0);
  const [borderColor, setBorderColor] = useState("#ffffff");
  const [text, setText] = useState("");
  const [textPos, setTextPos] = useState<TextPos>("bottom");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textPct, setTextPct] = useState(7);

  const [result, setResult] = useState<CompressResult | null>(null);
  const [encodeMs, setEncodeMs] = useState<number | null>(null);
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

  // An image handed off from another tool (landing dropzone, crop, resize):
  // load it straight in. One-shot on mount.
  useEffect(() => {
    const f = takeHandoffImage();
    if (f) void onFile(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!img) return;
    setUnlocked(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setProcessing(true);
      setError(null);
      try {
        let transformed = drawResized(img);
        if (rotation !== 0) transformed = rotateCanvas(transformed, rotation as 90 | 180 | 270);
        if (flipH) transformed = flipCanvas(transformed, "horizontal");
        if (flipV) transformed = flipCanvas(transformed, "vertical");

        const bw = Math.round((borderW / 100) * Math.min(transformed.width, transformed.height));
        const out = document.createElement("canvas");
        out.width = transformed.width + bw * 2;
        out.height = transformed.height + bw * 2;
        const ctx = out.getContext("2d")!;
        if (bw > 0) {
          ctx.fillStyle = borderColor;
          ctx.fillRect(0, 0, out.width, out.height);
        }
        ctx.filter = buildFilterString(brightness, contrast, saturation, preset);
        ctx.drawImage(transformed, bw, bw);
        ctx.filter = "none";

        if (text.trim()) {
          const fontPx = Math.max(12, Math.round((out.width * textPct) / 100));
          const font = `bold ${fontPx}px Arial, "Helvetica Neue", sans-serif`;
          ctx.font = font;
          const lines = wrapText((s) => ctx.measureText(s).width, text, out.width * 0.92);
          drawTextBlock(ctx, lines, out.width / 2, out.height, {
            font,
            fill: textColor,
            stroke: "rgba(0,0,0,0.55)",
            strokeWidth: Math.max(1, fontPx * 0.06),
            anchor: textPos,
            lineHeight: fontPx * 1.15,
            paddingPx: fontPx * 0.6,
          });
        }

        const t0 = performance.now();
        const r = await compressToQuality(out, format, 92);
        setEncodeMs(Math.round(performance.now() - t0));
        setResult(r);
      } catch {
        setError("Could not apply those edits.");
      } finally {
        setProcessing(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [img, preset, brightness, contrast, saturation, rotation, flipH, flipV, borderW, borderColor, text, textPos, textColor, textPct, format]);

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
    downloadBlob(result.blob, `${base}-edited.${ext}`);
  }

  async function pipeToCompressor() {
    if (!result) return;
    const ext = format === "jpeg" ? "jpg" : format;
    const base = file?.name.replace(/\.[^.]+$/, "") || "image";
    const handoff = new File([result.blob], `${base}-edited.${ext}`, { type: result.blob.type || `image/${format}` });
    await stashHandoffImage(handoff).catch(() => {});
    router.push("/app/?tool=compress");
  }

  function startOver() {
    setStep("upload");
    setFile(null);
    setImg(null);
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
          heading="Photo editor"
          subheading="Adjust light and colour, add a border or a caption, rotate — entirely in your browser."
          hint="Any JPEG, PNG, or WebP"
        />
        {error && <Notice tone="error">{error}</Notice>}
      </>
    );
  }

  const iconBtn =
    "flex h-9 items-center justify-center gap-1 rounded-lg bg-surface-container text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface";
  const dims = result ? `${result.width} × ${result.height}` : "…";

  return (
    <div className={STUDIO_FRAME}>
      <button onClick={startOver} className="text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface">
        ← Choose a different photo
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">tune</span>
          <h2 className="font-display text-base font-semibold">Photo Editor</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatPill icon="crop_free" label="Size" value={dims} tone="primary" />
          <StatPill icon="download" label="Output" value={result ? formatKb(result.blob.size / 1024) : "—"} />
          <StatPill icon="timer" label="Encoded" value={encodeMs != null ? `${encodeMs} ms` : "—"} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="overflow-hidden rounded-xl bg-black">
            <div className="flex items-center justify-between bg-surface-container-low px-3 py-2 text-xs text-on-surface-variant">
              <span className="truncate">{file?.name}</span>
              <span className="shrink-0 font-mono text-outline">{dims}</span>
            </div>
            <div className="relative flex items-center justify-center p-3 min-h-[200px]">
              <CanvasLoading show={!result} />
              <canvas
                ref={canvasRef}
                role="img"
                aria-label="Edited photo preview"
                className={`max-h-[62vh] max-w-full object-contain ${!result ? "invisible" : ""}`}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <div className="space-y-4 rounded-xl bg-surface-container-low p-4">
            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-outline">Filter</span>
              <div className="flex flex-wrap gap-1">
                {FILTER_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPreset(p.id)}
                    className={`rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                      preset === p.id ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <Slider id="ed-b" label="Brightness" value={brightness} set={setBrightness} />
            <Slider id="ed-c" label="Contrast" value={contrast} set={setContrast} />
            <Slider id="ed-s" label="Saturation" value={saturation} set={setSaturation} />

            <div>
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-outline">Rotate / flip</span>
              <div className="grid grid-cols-4 gap-1">
                <button className={iconBtn} onClick={() => setRotation((r) => (r + 270) % 360)}>
                  <span className="material-symbols-outlined text-[16px]">rotate_left</span>
                </button>
                <button className={iconBtn} onClick={() => setRotation((r) => (r + 90) % 360)}>
                  <span className="material-symbols-outlined text-[16px]">rotate_right</span>
                </button>
                <button className={`${iconBtn} ${flipH ? "!bg-primary/20 !text-primary-fixed" : ""}`} onClick={() => setFlipH((v) => !v)}>
                  <span className="material-symbols-outlined text-[16px]">flip</span>
                </button>
                <button className={`${iconBtn} ${flipV ? "!bg-primary/20 !text-primary-fixed" : ""}`} onClick={() => setFlipV((v) => !v)}>
                  <span className="material-symbols-outlined rotate-90 text-[16px]">flip</span>
                </button>
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-on-surface">Border</span>
                <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0" aria-label="Border colour" />
              </div>
              <input type="range" min={0} max={12} value={borderW} onChange={(e) => setBorderW(Number(e.target.value))} className="w-full accent-primary" aria-label="Border width" />
            </div>

            <div className="space-y-2 border-t border-outline-variant/30 pt-3">
              <label htmlFor="ed-text" className="block text-[11px] font-semibold uppercase tracking-wider text-outline">
                Caption
              </label>
              <input
                id="ed-text"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary/60 focus:outline-none"
              />
              {text.trim() && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-1 gap-1 rounded-lg bg-surface-container-lowest p-1">
                      {(["top", "center", "bottom"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setTextPos(p)}
                          className={`flex-1 rounded px-1 py-1 text-xs font-medium capitalize transition-colors ${
                            textPos === p ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:text-on-surface"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-8 w-9 cursor-pointer rounded border-0 bg-transparent p-0" aria-label="Caption colour" />
                  </div>
                  <input type="range" min={3} max={16} value={textPct} onChange={(e) => setTextPct(Number(e.target.value))} className="w-full accent-primary" aria-label="Caption size" />
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => (unlocked ? onAdComplete() : setShowAdGate(true))}
              disabled={!result || processing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-[0_0_20px_-4px_rgba(192,193,255,0.5)] transition-colors hover:bg-primary-container hover:text-on-primary-container disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              {processing ? "Rendering…" : unlocked ? `Download again (${result ? formatKb(result.blob.size / 1024) : ""})` : "Watch ad to download — free"}
            </button>
            <button
              onClick={pipeToCompressor}
              disabled={!result}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-surface-container-high px-4 py-2 text-xs font-medium text-secondary transition-colors hover:bg-surface-container-highest disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[16px]">compress</span>
              Send the edit to the compressor
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
