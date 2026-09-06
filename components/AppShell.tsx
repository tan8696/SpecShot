"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Spec } from "@/lib/specs";
import { ThemeToggle } from "./ThemeToggle";
import { PhotoTool } from "./PhotoTool";
import { CompressTool } from "./CompressTool";
import { SignatureTool } from "./SignatureTool";

type Mode = "id-photo" | "compress" | "signature";

const TABS: { id: Mode; label: string }[] = [
  { id: "id-photo", label: "ID Photo" },
  { id: "compress", label: "Compress Photo" },
  { id: "signature", label: "Signature Cleaner" },
];

export function AppShell({ specs }: { specs: Spec[] }) {
  const [mode, setMode] = useState<Mode>("id-photo");
  // Deep link from an SEO page's "create my photo" CTA: /?doc=uk-passport-photo
  const initialSlug = useSearchParams().get("doc") ?? undefined;

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline support is a bonus, not a requirement — fail silently.
      });
    }
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex items-center justify-between gap-3 border-b border-slate-200 pb-6 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-500/15 font-bold text-indigo-600 dark:text-indigo-300">
            S
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">SpecShot</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Free, ad-supported. Nothing leaves your browser — photos are processed locally.
            </p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <div
        role="tablist"
        aria-label="Tool"
        className="mb-6 inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={mode === tab.id}
            onClick={() => setMode(tab.id)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              mode === tab.id
                ? "bg-indigo-500 text-white"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "id-photo" && <PhotoTool specs={specs} initialSlug={initialSlug} />}
      {mode === "compress" && <CompressTool />}
      {mode === "signature" && <SignatureTool />}

      <footer className="mt-12 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-slate-200 pt-6 text-xs text-slate-500 dark:border-slate-800">
        <Link href="/photo" className="hover:text-slate-700 dark:hover:text-slate-300">
          All document specs
        </Link>
        <span>·</span>
        <Link href="/business" className="hover:text-slate-700 dark:hover:text-slate-300">
          SpecShot for consultancies &amp; coaching centres
        </Link>
      </footer>
    </div>
  );
}
