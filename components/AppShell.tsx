"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Spec } from "@/lib/specs";
import { ToolNav } from "./ToolNav";
import { PhotoTool } from "./PhotoTool";
import { CompressTool } from "./CompressTool";
import { SignatureTool } from "./SignatureTool";

type Mode = "id-photo" | "compress" | "signature";

const TABS: { id: Mode; label: string; shortLabel: string }[] = [
  { id: "id-photo", label: "ID Photo", shortLabel: "ID Photo" },
  { id: "compress", label: "Compress Photo", shortLabel: "Compress" },
  { id: "signature", label: "Signature Cleaner", shortLabel: "Signature" },
];

export function AppShell({ specs }: { specs: Spec[] }) {
  const searchParams = useSearchParams();
  // Deep link from an SEO page's "create my photo" CTA: /?doc=uk-passport-photo
  const initialSlug = searchParams.get("doc") ?? undefined;
  // Deep link from ToolNav's "Compress"/"Signature" entries: /?tool=compress
  const initialTool = searchParams.get("tool");
  const [mode, setMode] = useState<Mode>(initialTool === "compress" || initialTool === "signature" ? initialTool : "id-photo");

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline support is a bonus, not a requirement — fail silently.
      });
    }
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex items-center justify-between gap-3 border-b border-outline-variant/30 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container font-display text-sm font-bold text-on-primary-container">
            S
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight text-on-surface">SpecShot</h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[15px] text-secondary">lock</span>
              Runs in your browser — nothing is uploaded.
            </p>
          </div>
        </div>
        <ToolNav />
      </header>

      <div
        role="tablist"
        aria-label="Tool"
        className="mb-6 inline-flex rounded-lg border border-outline-variant/40 bg-surface-container-low p-1"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={mode === tab.id}
            onClick={() => setMode(tab.id)}
            className={`whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              mode === tab.id
                ? "bg-primary-container text-on-primary-container"
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            }`}
          >
            <span className="sm:hidden">{tab.shortLabel}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {mode === "id-photo" && <PhotoTool specs={specs} initialSlug={initialSlug} />}
      {mode === "compress" && <CompressTool />}
      {mode === "signature" && <SignatureTool />}

      <footer className="mt-12 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-outline-variant/30 pt-6 text-xs text-outline">
        <Link href="/photo" className="transition-colors hover:text-on-surface">
          All document specs
        </Link>
        <span>·</span>
        <Link href="/business" className="transition-colors hover:text-on-surface">
          SpecShot for consultancies &amp; coaching centres
        </Link>
        <span>·</span>
        <Link href="/privacy" className="transition-colors hover:text-on-surface">
          Privacy
        </Link>
        <span>·</span>
        <Link href="/cookies" className="transition-colors hover:text-on-surface">
          Cookies
        </Link>
        <span>·</span>
        <Link href="/terms" className="transition-colors hover:text-on-surface">
          Terms
        </Link>
      </footer>
    </div>
  );
}
