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
      <h2 className="mb-2 font-display text-2xl font-semibold tracking-tight text-on-surface">{heading}</h2>
      <p className="mb-10 max-w-md text-sm text-on-surface-variant">{subheading}</p>

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
        className={`flex w-full max-w-xl cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed px-10 py-16 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/40 ${
          dragOver
            ? "border-primary bg-primary/10"
            : "border-outline-variant/60 bg-surface-container-low hover:border-primary/60 hover:bg-surface-container"
        }`}
      >
        <span className="material-symbols-outlined text-[44px] text-outline">add_photo_alternate</span>

        <span className="rounded-lg bg-primary-container px-5 py-2.5 text-sm font-semibold text-on-primary-container shadow-sm">
          {dragOver ? "Drop it" : selectLabel}
        </span>
        <span className="text-sm text-on-surface-variant">or drag and drop {multiple ? "them" : "it"} here</span>
        <span className="text-xs text-outline">{hint}</span>

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
