import type { ReactNode } from "react";

export function Notice({ tone, children }: { tone: "info" | "error" | "warn"; children: ReactNode }) {
  const styles = {
    info: "border-primary/40 bg-primary/10 text-primary-fixed",
    error: "border-red-500/40 bg-red-500/10 text-red-400",
    warn: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  }[tone];
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`rounded-lg border px-3 py-2 text-sm ${styles}`}
    >
      {children}
    </p>
  );
}
