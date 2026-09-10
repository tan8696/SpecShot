"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { compressToQuality, drawResized, formatFromMime, loadImageFile, type CompressFormat, type CompressResult } from "@/lib/engine/compress";
import { rotateCanvas, flipCanvas } from "@/lib/engine/rotate";
import { buildFilterString, FILTER_PRESETS, type FilterPreset } from "@/lib/engine/editor";
import { wrapText, drawTextBlock } from "@/lib/engine/textlayer";
import { withWatermark } from "@/lib/engine/watermark";
import { downloadBlob } from "@/lib/download";
import { takeHandoffImage } from "@/lib/handoff";
import { Notice } from "./Notice";
import { UploadScreen } from "./UploadScreen";
import { AdGate } from "./AdGate";

type Step = "upload" | "configure";
type TextPos = "top" | "center" | "bottom";

function Slider({ id, label, value, set, min = 50, max = 150 }: { id: string; label: string; value: number; set: (n: number) => void; min?: number; max?: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
          {label}
        </label>
        <span className="font-mono text-xs text-slate-500">{value}%</span>
      </div>
      <input id={id} type="range" min={min} max={max} value={value} onChange={(e) => set(Number(e.target.value))} className="w-full accent-indigo-500" />
    </div>
  );
}

export function PhotoEditorTool() {
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

  // An image handed off from the landing-page dropzone: load it straight into
  // the editor instead of showing the upload screen. One-shot on mount.
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

        setResult(await compressToQuality(out, format, 92));
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
          heading="Photo editor"
          subheading="Adjust light and colour, add a border or a caption, rotate — entirely in your browser."
          hint="Any JPEG, PNG, or WebP"
        />
        {error && <Notice tone="error">{error}</Notice>}
      </>
    );
  }

  const btn = "rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800";

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
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Filter</span>
            <div className="flex flex-wrap gap-1">
              {FILTER_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id)}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    preset === p.id ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-800"
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
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Rotate / flip</span>
            <div className="grid grid-cols-4 gap-1">
              <button className={btn} onClick={() => setRotation((r) => (r + 270) % 360)}>↺</button>
              <button className={btn} onClick={() => setRotation((r) => (r + 90) % 360)}>↻</button>
              <button className={`${btn} ${flipH ? "!bg-indigo-500 !text-white" : ""}`} onClick={() => setFlipH((v) => !v)}>⇋</button>
              <button className={`${btn} ${flipV ? "!bg-indigo-500 !text-white" : ""}`} onClick={() => setFlipV((v) => !v)}>⇵</button>
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Border</span>
              <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0" aria-label="Border colour" />
            </div>
            <input type="range" min={0} max={12} value={borderW} onChange={(e) => setBorderW(Number(e.target.value))} className="w-full accent-indigo-500" aria-label="Border width" />
          </div>

          <div className="space-y-2 border-t border-slate-200 pt-3 dark:border-slate-800">
            <label htmlFor="ed-text" className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
              Caption
            </label>
            <input
              id="ed-text"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            {text.trim() && (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 gap-1 rounded-md bg-slate-100 p-1 dark:bg-slate-950">
                    {(["top", "center", "bottom"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setTextPos(p)}
                        className={`flex-1 rounded px-1 py-1 text-xs font-medium capitalize transition-colors ${
                          textPos === p ? "bg-indigo-500 text-white" : "text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="h-8 w-9 cursor-pointer rounded border-0 bg-transparent p-0" aria-label="Caption colour" />
                </div>
                <input type="range" min={3} max={16} value={textPct} onChange={(e) => setTextPct(Number(e.target.value))} className="w-full accent-indigo-500" aria-label="Caption size" />
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => (unlocked ? onAdComplete() : setShowAdGate(true))}
          disabled={!result || processing}
          className="w-full rounded-md bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {processing ? "Rendering…" : unlocked ? "Download again" : "Watch ad to download — free"}
        </button>

        {error && <Notice tone="error">{error}</Notice>}
      </aside>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <canvas ref={canvasRef} role="img" aria-label="Edited photo preview" className="h-auto max-h-[75vh] w-full object-contain" />
      </div>

      {showAdGate && <AdGate onComplete={onAdComplete} onCancel={() => setShowAdGate(false)} />}
    </div>
  );
}
