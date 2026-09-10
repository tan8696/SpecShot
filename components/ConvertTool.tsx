"use client";

import { useEffect, useRef, useState } from "react";
import {
  loadImageFile,
  drawResized,
  compressToQuality,
  formatFromMime,
  type CompressFormat,
  type CompressResult,
} from "@/lib/engine/compress";
import { downloadBlob } from "@/lib/download";
import { Notice } from "./Notice";
import { UploadScreen } from "./UploadScreen";
import { AdGate } from "./AdGate";
import { StatPill, StudioPrivacyNote, formatKb, STUDIO_FRAME } from "./studioUi";

type Step = "upload" | "queue";
type Matte = "white" | "black";
type ItemStatus = "pending" | "processing" | "done" | "error";

type Item = {
  id: string;
  file: File;
  img: HTMLImageElement;
  source: CompressFormat;
  target: CompressFormat;
  status: ItemStatus;
  result?: CompressResult;
  ms?: number;
  thumb: string;
};

const FORMATS: CompressFormat[] = ["jpeg", "png", "webp"];
const LABELS: Record<CompressFormat, string> = { jpeg: "JPG", png: "PNG", webp: "WebP" };
const MAX_FILES = 40;

let seq = 0;

/** Flatten transparency onto a matte before a JPEG encode (JPG has no alpha —
 * without this, transparent pixels come out black). PNG/WebP keep their alpha,
 * so this is a no-op for them. */
function drawForTarget(img: HTMLImageElement, target: CompressFormat, matte: Matte): HTMLCanvasElement {
  const c = drawResized(img);
  if (target !== "jpeg") return c;
  const flat = document.createElement("canvas");
  flat.width = c.width;
  flat.height = c.height;
  const ctx = flat.getContext("2d")!;
  ctx.fillStyle = matte === "black" ? "#000000" : "#ffffff";
  ctx.fillRect(0, 0, flat.width, flat.height);
  ctx.drawImage(c, 0, 0);
  return flat;
}

export function ConvertTool() {
  const [step, setStep] = useState<Step>("upload");
  const [items, setItems] = useState<Item[]>([]);
  const [globalTarget, setGlobalTarget] = useState<CompressFormat>("webp");
  const [quality, setQuality] = useState(90);
  const [matte, setMatte] = useState<Matte>("white");
  const [unlocked, setUnlocked] = useState(false);
  const [showAdGate, setShowAdGate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingAction = useRef<{ type: "all" } | { type: "one"; id: string } | null>(null);
  const qualityDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef(false);

  async function addFiles(files: File[]) {
    setError(null);
    const images = files.filter((f) => f.type.startsWith("image/")).slice(0, MAX_FILES - items.length);
    if (images.length === 0) {
      setError("Those don't look like image files.");
      return;
    }
    const loaded: Item[] = [];
    for (const file of images) {
      try {
        const img = await loadImageFile(file);
        const source = formatFromMime(file.type);
        loaded.push({
          id: `c${seq++}`,
          file,
          img,
          source,
          target: globalTarget === source ? (source === "png" ? "jpeg" : "png") : globalTarget,
          status: "pending",
          thumb: img.src,
        });
      } catch {
        // skip the unreadable one, keep the rest
      }
    }
    if (loaded.length === 0) {
      setError("Could not read any of those images.");
      return;
    }
    setItems((s) => [...s, ...loaded]);
    setUnlocked(false);
    setStep("queue");
  }

  // Encode the next pending item, one at a time. `busyRef` (not the effect's
  // own re-runs) is the lock, so marking an item "processing" doesn't cancel
  // its own encode. If the item's settings changed while it was encoding it
  // will have been flipped back to "pending" — the status check drops the
  // now-stale result and it gets re-encoded.
  useEffect(() => {
    if (busyRef.current) return;
    const next = items.find((i) => i.status === "pending");
    if (!next) return;
    busyRef.current = true;
    const { id, img, target } = next;
    (async () => {
      setItems((s) => s.map((i) => (i.id === id ? { ...i, status: "processing" } : i)));
      try {
        const canvas = drawForTarget(img, target, matte);
        const t0 = performance.now();
        const r = await compressToQuality(canvas, target, quality);
        const ms = Math.round(performance.now() - t0);
        setItems((s) => s.map((i) => (i.id === id && i.status === "processing" ? { ...i, status: "done", result: r, ms } : i)));
      } catch {
        setItems((s) => s.map((i) => (i.id === id && i.status === "processing" ? { ...i, status: "error" } : i)));
      } finally {
        // `setItems` above always returns a fresh array, so clearing the lock
        // here lets the re-run pick up the next pending item.
        busyRef.current = false;
      }
    })();
  }, [items, matte, quality]);

  function requeueAll() {
    setUnlocked(false);
    setItems((s) => s.map((i) => ({ ...i, status: "pending", result: undefined, ms: undefined })));
  }

  function chooseGlobalTarget(f: CompressFormat) {
    setGlobalTarget(f);
    setUnlocked(false);
    setItems((s) => s.map((i) => ({ ...i, target: f, status: "pending", result: undefined, ms: undefined })));
  }

  function chooseItemTarget(id: string, f: CompressFormat) {
    setUnlocked(false);
    setItems((s) => s.map((i) => (i.id === id ? { ...i, target: f, status: "pending", result: undefined, ms: undefined } : i)));
  }

  function onQuality(v: number) {
    setQuality(v);
    if (qualityDebounce.current) clearTimeout(qualityDebounce.current);
    qualityDebounce.current = setTimeout(requeueAll, 250);
  }

  useEffect(() => {
    if (matte) requeueAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matte]);

  function removeItem(id: string) {
    setItems((s) => s.filter((i) => i.id !== id));
  }

  function clearAll() {
    setItems([]);
    setStep("upload");
    setUnlocked(false);
  }

  function nameFor(it: Item) {
    const base = it.file.name.replace(/\.[^.]+$/, "") || "image";
    return `${base}.${it.target === "jpeg" ? "jpg" : it.target}`;
  }

  function downloadOne(it: Item) {
    if (!it.result) return;
    if (!unlocked) {
      pendingAction.current = { type: "one", id: it.id };
      setShowAdGate(true);
      return;
    }
    downloadBlob(it.result.blob, nameFor(it));
  }

  async function downloadAll() {
    const done = items.filter((i) => i.status === "done" && i.result);
    if (done.length === 0) return;
    if (!unlocked) {
      pendingAction.current = { type: "all" };
      setShowAdGate(true);
      return;
    }
    for (const it of done) {
      downloadBlob(it.result!.blob, nameFor(it));
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  function onAdComplete() {
    setShowAdGate(false);
    setUnlocked(true);
    const action = pendingAction.current;
    pendingAction.current = null;
    if (action?.type === "all") {
      void (async () => {
        for (const it of items.filter((i) => i.status === "done" && i.result)) {
          downloadBlob(it.result!.blob, nameFor(it));
          await new Promise((r) => setTimeout(r, 200));
        }
      })();
    } else if (action?.type === "one") {
      const it = items.find((i) => i.id === action.id);
      if (it?.result) downloadBlob(it.result.blob, nameFor(it));
    }
  }

  if (step === "upload") {
    return (
      <>
        <UploadScreen
          onFiles={addFiles}
          accept="image/png,image/jpeg,image/webp"
          heading="Convert images"
          subheading="Batch-convert between JPG, PNG, and WebP — every file stays in your browser."
          hint="Drop several at once · JPG, PNG, or WebP"
          selectLabel="Select images"
        />
        {error && <Notice tone="error">{error}</Notice>}
      </>
    );
  }

  const done = items.filter((i) => i.status === "done");
  const totalOrig = items.reduce((n, i) => n + i.file.size, 0);
  const totalOut = done.reduce((n, i) => n + (i.result?.blob.size ?? 0), 0);
  const savedPct = totalOrig && totalOut ? Math.round((1 - totalOut / totalOrig) * 100) : 0;
  const anyJpegTarget = items.some((i) => i.target === "jpeg");
  const allDone = items.length > 0 && items.every((i) => i.status === "done" || i.status === "error");

  return (
    <div className={STUDIO_FRAME}>
      <button onClick={clearAll} className="text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface">
        ← Start over
      </button>

      {/* Telemetry */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-low p-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">sync_alt</span>
          <h2 className="font-display text-base font-semibold">Converter</h2>
          <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[11px] text-secondary">
            {items.length} {items.length === 1 ? "file" : "files"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatPill icon="task_alt" label="Done" value={`${done.length}/${items.length}`} tone={allDone ? "secondary" : "neutral"} />
          <StatPill icon="savings" label="Saved" value={done.length ? `${savedPct}%` : "—"} tone={savedPct >= 0 ? "secondary" : "warn"} />
          <StatPill icon="folder_zip" label="Total out" value={done.length ? formatKb(totalOut / 1024) : "—"} tone="primary" />
        </div>
      </div>

      {/* Master controls */}
      <div className="grid gap-4 rounded-xl bg-surface-container-low p-4 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-outline">Convert every file to</span>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-surface-container-lowest p-1">
            {FORMATS.map((f) => (
              <button
                key={f}
                onClick={() => chooseGlobalTarget(f)}
                className={`rounded px-2 py-1.5 text-xs font-medium transition-colors ${
                  globalTarget === f ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {LABELS[f]}
              </button>
            ))}
          </div>
        </div>
        <div className="lg:col-span-6">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-outline">Quality (JPG / WebP)</span>
            <span className="rounded bg-surface-container px-1.5 py-0.5 font-mono text-[11px] text-secondary">{quality}%</span>
          </div>
          <input type="range" min={20} max={100} value={quality} onChange={(e) => onQuality(Number(e.target.value))} className="w-full accent-primary" />
        </div>
        {anyJpegTarget && (
          <div className="lg:col-span-12">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-outline">
              Transparent areas → JPG background
            </span>
            <div className="inline-grid grid-cols-2 gap-1 rounded-lg bg-surface-container-lowest p-1">
              {(["white", "black"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMatte(m)}
                  className={`rounded px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    matte === m ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Queue */}
      <div className="space-y-2">
        {items.map((it) => {
          const saved = it.result ? Math.round((1 - it.result.blob.size / it.file.size) * 100) : 0;
          return (
            <div key={it.id} className="flex flex-col gap-3 rounded-xl bg-surface-container-low p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-container-lowest">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.thumb} alt="" className="h-full w-full object-cover" />
                  <span className="absolute bottom-0.5 right-0.5 rounded bg-surface-container-lowest/90 px-1 font-mono text-[9px] text-outline">
                    {LABELS[it.source]}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-on-surface">{it.file.name}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-on-surface-variant">
                    <span>{it.img.naturalWidth}×{it.img.naturalHeight}</span>
                    <span className="text-outline">·</span>
                    <span>{formatKb(it.file.size / 1024)}</span>
                    {it.result && (
                      <>
                        <span className="text-outline">→</span>
                        <span className="text-secondary">{formatKb(it.result.blob.size / 1024)}</span>
                        <span className={`rounded px-1 ${saved >= 0 ? "bg-secondary/10 text-secondary" : "bg-amber-400/10 text-amber-400"}`}>
                          {saved >= 0 ? `−${saved}%` : `+${-saved}%`}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                <div className="flex items-center gap-1 rounded-lg bg-surface-container-lowest px-1.5 py-1">
                  <span className="text-[10px] uppercase text-outline">to</span>
                  <select
                    value={it.target}
                    onChange={(e) => chooseItemTarget(it.id, e.target.value as CompressFormat)}
                    className="bg-transparent font-mono text-xs text-on-surface focus:outline-none"
                  >
                    {FORMATS.map((f) => (
                      <option key={f} value={f} className="bg-surface-container">
                        {LABELS[f]}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="w-24 text-right font-mono text-[11px]">
                  {it.status === "processing" && <span className="text-on-surface-variant">encoding…</span>}
                  {it.status === "pending" && <span className="text-outline">queued</span>}
                  {it.status === "error" && <span className="text-amber-400">failed</span>}
                  {it.status === "done" && <span className="text-secondary">{it.ms} ms</span>}
                </span>
                <button
                  onClick={() => downloadOne(it)}
                  disabled={it.status !== "done"}
                  title="Download this file"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-on-surface-variant transition-colors hover:bg-primary hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                </button>
                <button
                  onClick={() => removeItem(it.id)}
                  title="Remove"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container text-outline transition-colors hover:bg-amber-400/20 hover:text-amber-400"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action bar */}
      <div className="flex flex-col gap-4 rounded-xl bg-surface-container-low p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 font-mono text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px] text-secondary">folder_zip</span>
          {done.length ? (
            <span>
              {formatKb(totalOrig / 1024)} → <span className="text-secondary">{formatKb(totalOut / 1024)}</span>
              {" "}({savedPct >= 0 ? `${savedPct}% lighter` : `${-savedPct}% heavier`})
            </span>
          ) : (
            <span>Encoding {items.length} file{items.length === 1 ? "" : "s"}…</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-surface-container px-3 py-2 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
            Add more
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              hidden
              onChange={(e) => {
                addFiles(Array.from(e.target.files ?? []));
                e.currentTarget.value = "";
              }}
            />
          </label>
          <button
            onClick={downloadAll}
            disabled={done.length === 0}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-[0_0_20px_-4px_rgba(192,193,255,0.5)] transition-colors hover:bg-primary-container hover:text-on-primary-container disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            {unlocked ? `Download all (${done.length})` : `Watch ad · download all (${done.length})`}
          </button>
        </div>
      </div>

      <StudioPrivacyNote />

      {error && <Notice tone="error">{error}</Notice>}
      {showAdGate && (
        <AdGate
          onComplete={onAdComplete}
          onCancel={() => {
            setShowAdGate(false);
            pendingAction.current = null;
          }}
        />
      )}
    </div>
  );
}
