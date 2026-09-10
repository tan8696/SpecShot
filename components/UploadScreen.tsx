"use client";

import { useState, type ReactNode } from "react";

/**
 * The first screen of every tool's wizard flow: upload, and nothing else.
 * Settings only appear once a file is chosen (the "configure" step) — this
 * mirrors the reference flow (a prominent upload screen, then a separate
 * settings screen, then one ad, then the result).
 */
export function UploadScreen({
  onFile,
  onFiles,
  heading,
  subheading,
  hint,
  extraAction,
  accept = "image/*",
  selectLabel = "Select a photo",
}: {
  onFile?: (file: File) => void;
  // For the Image -> PDF tool, which takes several images at once.
  onFiles?: (files: File[]) => void;
  heading: string;
  subheading: string;
  hint: string;
  extraAction?: ReactNode;
  // HEIC files often don't match "image/*" in a non-Apple OS file picker,
  // so the HEIC tool passes an explicit extension list.
  accept?: string;
  selectLabel?: string;
}) {
  const [dragOver, setDragOver] = useState(false);
  const multiple = !!onFiles;

  function handle(list: FileList | null | undefined) {
    const files = list ? Array.from(list) : [];
    if (files.length === 0) return;
    if (onFiles) onFiles(files);
    else onFile?.(files[0]);
  }

  return (
    <div className="flex flex-col items-center py-16 text-center">
      <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{heading}</h2>
      <p className="mb-10 max-w-md text-sm text-slate-600 dark:text-slate-400">{subheading}</p>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handle(e.dataTransfer.files);
        }}
        className={`flex w-full max-w-xl cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed px-10 py-16 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500/40 ${
          dragOver
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
            : "border-slate-300 bg-slate-50 hover:border-indigo-500/60 dark:border-slate-700 dark:bg-slate-950"
        }`}
      >
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="10" r="1.5" />
          <path d="M21 16l-5.5-5.5L3 20" />
        </svg>

        <span className="rounded-md bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
          {dragOver ? "Drop it" : selectLabel}
        </span>
        <span className="text-sm text-slate-500">or drag and drop {multiple ? "them" : "it"} here</span>
        <span className="text-xs text-slate-400">{hint}</span>

        {/* sr-only, not hidden: display:none removes an input from the tab
            order entirely, which makes it unreachable by keyboard. */}
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => {
            handle(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {extraAction && <div className="mt-4">{extraAction}</div>}
    </div>
  );
}
