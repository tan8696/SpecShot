import type { ComplianceCheck } from "@/lib/engine/pipeline";

/** The hero element per design direction: this is what a stranger decides to
 * pay from, not the photo. Bordered and lifted above the other cards so it
 * doesn't blend into a wall of identical panels. */
export function ComplianceChecklist({
  checks,
  allPassed,
}: {
  checks: ComplianceCheck[];
  allPassed: boolean;
}) {
  const accent = allPassed
    ? "border-emerald-500/60 text-emerald-600 dark:text-emerald-400"
    : "border-red-500/60 text-red-600 dark:text-red-400";
  const badge = allPassed
    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    : "bg-red-500/10 text-red-700 dark:text-red-400";

  return (
    <div
      className={`rounded-lg border-2 bg-white p-4 shadow-lg dark:bg-slate-900 ${
        allPassed ? "border-emerald-500/60" : "border-red-500/60"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className={`text-base font-semibold ${accent}`}>{allPassed ? "Meets spec" : "Needs a retake"}</h2>
        <span className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${badge}`}>
          {checks.filter((c) => c.pass).length}/{checks.length} PASS
        </span>
      </div>
      <ul className="space-y-2.5">
        {checks.map((c) => (
          <li key={c.id} className="flex items-start gap-2 text-sm">
            <span
              className={`mt-0.5 font-bold ${c.pass ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
            >
              {c.pass ? "✓" : "✗"}
            </span>
            <span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{c.label}</span>
              <span className="block font-mono text-xs text-slate-600 dark:text-slate-400">{c.detail}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-slate-200 pt-2.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        This is a measurement, not a guarantee — the issuing authority always makes the final call.
      </p>
    </div>
  );
}
