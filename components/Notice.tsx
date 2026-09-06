import type { ReactNode } from "react";

export function Notice({ tone, children }: { tone: "info" | "error" | "warn"; children: ReactNode }) {
  const styles = {
    info: "border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-200",
    error: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-200",
    warn: "border-amber-500/50 bg-amber-500/10 text-amber-800 dark:border-amber-500/40 dark:text-amber-200",
  }[tone];
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`rounded-md border px-3 py-2 text-sm ${styles}`}
    >
      {children}
    </p>
  );
}
