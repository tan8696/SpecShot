import type { Metadata } from "next";
import Link from "next/link";
import { WaitlistForm } from "@/components/WaitlistForm";

export const metadata: Metadata = {
  title: "SpecShot API for Visa Consultancies & Exam Coaching Centres",
  description: "Bulk ID photo compliance checking and cropping via API — for firms processing photos for many clients at once.",
};

const FEATURES = [
  "The same measurement engine as the consumer tool — crown detection, re-verified compliance, not a rough crop",
  "Bulk processing: send many photos against one or many document specs in a single request",
  "Every spec verified against its government source, not copied from another photo site — the library grows as more documents are checked",
  "No per-seat pricing — pay for renders, not headcount",
];

export default function BusinessPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="mb-2 text-sm">
        <Link href="/" className="text-indigo-600 hover:underline dark:text-indigo-400">
          ← Back to the tool
        </Link>
      </p>

      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        Processing ID photos for clients by hand?
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Visa consultancies and exam coaching centres use SpecShot's engine directly via API instead of cropping
        photos one at a time in Photoshop.
      </p>

      <ul className="mt-8 space-y-3">
        {FEATURES.map((f) => (
          <li key={f} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
            <span className="text-indigo-500">•</span>
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-8 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800">
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">$0.30</p>
            <p className="text-xs text-slate-500">per render</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">$199–499</p>
            <p className="text-xs text-slate-500">per month, volume plans</p>
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Get early access</h2>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          The API isn't public yet. Leave your details and you'll hear first when it opens up.
        </p>
        <WaitlistForm />
      </div>
    </div>
  );
}
