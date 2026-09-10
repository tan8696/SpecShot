"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Scanner from "./Scanner";
import { CATEGORY_LABELS, TOOLS, type ToolCategory } from "@/lib/tools";
import { stashHandoffImage } from "@/lib/handoff";

type Filter = "all" | ToolCategory;

const FILTERS: Filter[] = ["all", "optimize", "transform", "create", "document"];
const ICON_ACCENT = ["text-primary", "text-secondary", "text-tertiary"];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Do my photos get uploaded anywhere?",
    a: "No. SpecShot has no upload endpoint. Every tool runs in your browser using WebAssembly and the Canvas API — open your browser's Network tab and you'll see no image data leaves the page.",
  },
  {
    q: "Is there a file-size or usage limit?",
    a: "No artificial limits, quotas or paywalls. Large panoramas and multi-page PDFs are bounded only by the memory your device has free.",
  },
  {
    q: "Which browsers are supported?",
    a: "Any current version of Chrome, Safari, Firefox, Edge or Brave. A few tools lean on WebAssembly — HEIC decoding, background removal — which all of them support.",
  },
  {
    q: "How is it free?",
    a: "One short ad unlocks a download. There's no account and no subscription, and the file you download has no watermark on it.",
  },
];

const PROMISES: { icon: string; title: string; body: string }[] = [
  {
    icon: "vpn_lock",
    title: "Nothing is uploaded",
    body: "There is no server to upload to. Face detection, background removal and every conversion run as code inside your own browser tab.",
  },
  {
    icon: "all_inclusive",
    title: "No limits or quotas",
    body: "No 5 MB cap, no daily count, no pro tier. The only ceiling is how much memory your device has free.",
  },
  {
    icon: "wifi_off",
    title: "Works offline",
    body: "Install it once as an app and the tools keep working with no connection — on a plane, on the subway, anywhere.",
  },
  {
    icon: "person_off",
    title: "No account, ever",
    body: "No sign-up, no email, no tracking cookies. Open a tool and use it.",
  },
];

export function LandingPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const tools = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS.filter((t) => {
      if (filter !== "all" && t.category !== filter) return false;
      if (!q) return true;
      return `${t.label} ${t.description}`.toLowerCase().includes(q);
    });
  }, [filter, query]);

  function handleFiles(list: FileList | null) {
    const file = list && Array.from(list).find((f) => f.type.startsWith("image/"));
    if (!file) return;
    setBusy(true);
    stashHandoffImage(file)
      .catch(() => {
        /* too large for sessionStorage — the editor will just show its upload screen */
      })
      .finally(() => router.push("/photo-editor/"));
  }

  // A hand-tweened scroll to the tool grid — a slow, dramatic glide (1.4–2.8s,
  // scaled to distance) on an easeInOutQuint curve: long, deliberate build,
  // equally long settle. A wheel/touch from the visitor hands control straight
  // back; honours prefers-reduced-motion with an instant jump.
  function scrollToTools(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    const el = document.getElementById("tools");
    if (!el) return;
    const startY = window.scrollY;
    const target = el.getBoundingClientRect().top + startY - 72; // clear the sticky header
    const dist = target - startY;
    if (Math.abs(dist) < 4) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo(0, target);
      return;
    }

    const duration = Math.min(2800, Math.max(1400, Math.abs(dist) * 1.8));
    const ease = (p: number) => (p < 0.5 ? 16 * p * p * p * p * p : 1 - Math.pow(-2 * p + 2, 5) / 2);

    let cancelled = false;
    const stop = () => {
      cancelled = true;
    };
    const cleanup = () => {
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
    };
    window.addEventListener("wheel", stop, { passive: true, once: true });
    window.addEventListener("touchstart", stop, { passive: true, once: true });

    let startTime: number | null = null;
    const tick = (now: number) => {
      if (cancelled) return cleanup();
      if (startTime === null) startTime = now;
      const p = Math.min((now - startTime) / duration, 1);
      window.scrollTo(0, startY + dist * ease(p));
      if (p < 1) requestAnimationFrame(tick);
      else cleanup();
    };
    requestAnimationFrame(tick);
  }

  return (
    <div className="relative min-h-screen font-body text-on-surface antialiased">
      {/* Opaque base — sits under the WebGL layer so the page never falls back
          to the light <body> background when the OS theme is light. */}
      <div className="fixed inset-0 -z-20 bg-surface-container-lowest" />

      {/* WebGL scan-field background + legibility scrim */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <Scanner
          color1="#5227FF"
          color2="#7bd0ff"
          color3="#e1e0ff"
          speed={0.3}
          sweepSpeed={0.16}
          sweepWidth={1.7}
          scale={1.9}
          bandDensity={10}
          glow={0.2}
          brightness={1}
          contrast={1.15}
          vignette={0.55}
          softness={1.5}
          scanline={false}
          grain
          grainIntensity={0.03}
          opacity={0.9}
          mouseInteraction={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-surface-container-lowest/25 via-surface-container-lowest/55 to-surface-container-lowest/85" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-outline-variant/25 bg-surface-container-lowest/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-container font-display text-sm font-bold text-on-primary-container">
              S
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-on-surface">SpecShot</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-on-surface-variant md:flex">
            <a href="#tools" onClick={scrollToTools} className="transition-colors hover:text-on-surface">
              Tools
            </a>
            <Link href="/photo/" className="transition-colors hover:text-on-surface">
              Document specs
            </Link>
            <Link href="/privacy/" className="transition-colors hover:text-on-surface">
              Privacy
            </Link>
          </nav>
          <Link
            href="/app/"
            className="inline-flex items-center rounded-lg bg-primary-container px-4 py-2 text-sm font-medium text-on-primary-container shadow-[0_0_20px_-6px_rgba(192,193,255,0.45)] transition-colors hover:bg-primary"
          >
            Open the tools
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="flex flex-col items-center py-20 text-center sm:py-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-container-high/70 px-3.5 py-1.5 text-xs text-on-surface-variant backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            No uploads &nbsp;·&nbsp; Works offline &nbsp;·&nbsp; No account
          </div>
          <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.08] tracking-tight text-on-surface sm:text-6xl">
            Image tools that never leave your{" "}
            <span className="bg-gradient-to-r from-primary via-secondary to-tertiary bg-clip-text text-transparent">
              browser
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-on-surface-variant sm:text-lg">
            Thirteen focused tools for photos, scans and PDFs — passport crops, compression, format
            conversion and more. Every byte stays on your device.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#tools"
              onClick={scrollToTools}
              className="inline-flex items-center justify-center rounded-xl bg-primary-container px-6 py-3 text-sm font-semibold text-on-primary-container shadow-xl transition-colors hover:bg-primary"
            >
              Browse the tools
            </a>
            <Link
              href="/app/"
              className="inline-flex items-center justify-center rounded-xl border border-outline-variant/50 bg-surface-container/60 px-6 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
            >
              Make a passport photo
            </Link>
          </div>

          {/* Drop-to-edit bar */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={`group mt-12 w-full max-w-2xl rounded-2xl border border-dashed p-6 text-left backdrop-blur-xl transition-colors ${
              dragging
                ? "border-primary bg-primary/10"
                : "border-outline-variant/50 bg-surface-container/60 hover:border-primary/60 hover:bg-surface-container-high/70"
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <span className="material-symbols-outlined text-[26px]">upload</span>
              </span>
              <div>
                <p className="font-display text-base font-medium text-on-surface">
                  {busy ? "Opening the editor…" : "Drop an image to start editing"}
                </p>
                <p className="mt-0.5 text-sm text-on-surface-variant">
                  Or click to choose — it opens in the photo editor. Nothing is uploaded.
                </p>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />
          </button>

          <dl className="mt-12 grid grid-cols-2 gap-x-10 gap-y-4 text-left sm:grid-cols-4">
            {[
              ["13", "browser tools"],
              ["0", "bytes uploaded"],
              ["—", "file-size limit"],
              ["Free", "ad-supported"],
            ].map(([n, label]) => (
              <div key={label}>
                <dt className="font-display text-2xl font-semibold text-on-surface">{n}</dt>
                <dd className="text-xs text-on-surface-variant">{label}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Filter + search */}
        <section id="tools" className="scroll-mt-20">
          <div className="flex flex-col gap-4 rounded-2xl border border-outline-variant/25 bg-surface-container-low/70 p-4 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    filter === f
                      ? "bg-primary-container text-on-primary-container"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {f === "all" ? "All tools" : CATEGORY_LABELS[f]}
                </button>
              ))}
            </div>
            <div className="relative w-full lg:w-72">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                search
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a tool…"
                aria-label="Find a tool"
                className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest py-2 pl-9 pr-3 text-sm text-on-surface placeholder:text-outline focus:border-primary/60 focus:outline-none"
              />
            </div>
          </div>

          {/* Tool grid */}
          {tools.length === 0 ? (
            <p className="py-16 text-center text-sm text-on-surface-variant">
              No tool matches “{query}”.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((t, i) => (
                <Link
                  key={t.id}
                  href={t.href}
                  className="group flex flex-col justify-between rounded-2xl border border-outline-variant/25 bg-surface-container-low/70 p-5 backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-surface-container/80"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-high ${ICON_ACCENT[i % 3]}`}
                      >
                        <span className="material-symbols-outlined text-[22px]">{t.icon}</span>
                      </span>
                      <span className="font-mono text-xs text-outline">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-base font-semibold text-on-surface group-hover:text-primary">
                      {t.label}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{t.description}</p>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-outline transition-colors group-hover:text-primary">
                    Open
                    <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-0.5">
                      arrow_forward
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Why on-device */}
        <section className="py-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Why browser-based
            </span>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-on-surface">
              Your files stay on your machine
            </h2>
            <p className="mt-3 text-on-surface-variant">
              Most image sites upload your photo to a server you have to trust. SpecShot does the work
              where the file already is.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {PROMISES.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-outline-variant/25 bg-surface-container-low/70 p-6 backdrop-blur-xl"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <span className="material-symbols-outlined text-[22px]">{p.icon}</span>
                </span>
                <h3 className="mt-4 font-display text-base font-semibold text-on-surface">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="pb-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-tertiary">Questions</span>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-on-surface">
              Frequently asked
            </h2>
          </div>
          <div className="mx-auto mt-10 max-w-3xl space-y-2.5">
            {FAQ.map((item, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={item.q}
                  className="overflow-hidden rounded-xl border border-outline-variant/25 bg-surface-container-low/70 backdrop-blur-xl"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 p-4 text-left"
                  >
                    <span className="font-display text-base font-medium text-on-surface">{item.q}</span>
                    <span
                      className={`material-symbols-outlined shrink-0 text-outline transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                  {open && (
                    <p className="px-4 pb-4 text-sm leading-relaxed text-on-surface-variant">{item.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="pb-24">
          <div className="relative overflow-hidden rounded-3xl border border-outline-variant/25 bg-surface-container/80 p-10 text-center backdrop-blur-xl sm:p-16">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-on-surface">
                Ready when you are
              </h2>
              <p className="mx-auto mt-3 max-w-md text-on-surface-variant">
                No install, no sign-up, no credits. Pick a tool and go.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <a
                  href="#tools"
                  className="inline-flex items-center justify-center rounded-xl bg-primary-container px-6 py-3 text-sm font-semibold text-on-primary-container shadow-xl transition-colors hover:bg-primary"
                >
                  Browse the tools
                </a>
                <Link
                  href="/app/"
                  className="inline-flex items-center justify-center rounded-xl border border-outline-variant/50 bg-surface-container-high px-6 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-highest"
                >
                  Make a passport photo
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant/25 bg-surface-container-lowest/80">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <span className="font-display text-lg font-semibold text-on-surface">SpecShot</span>
              <p className="mt-2 text-sm text-on-surface-variant">
                Browser-based image tools. Nothing you open is uploaded.
              </p>
            </div>
            <FooterCol
              title="Tools"
              links={[
                ["ID photo", "/app/"],
                ["Compress", "/app/?tool=compress"],
                ["Resize", "/resize-image/"],
                ["All tools", "/tools/"],
              ]}
            />
            <FooterCol
              title="More"
              links={[
                ["Document specs", "/photo/"],
                ["For businesses", "/business/"],
              ]}
            />
            <FooterCol
              title="Legal"
              links={[
                ["Privacy", "/privacy/"],
                ["Terms", "/terms/"],
              ]}
            />
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-outline-variant/20 pt-6 text-xs text-on-surface-variant sm:flex-row">
            <p>© {new Date().getFullYear()} SpecShot</p>
            <p className="inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-secondary">lock</span>
              100% client-side
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-outline">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="text-on-surface-variant transition-colors hover:text-on-surface">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
