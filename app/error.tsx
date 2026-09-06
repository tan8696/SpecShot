"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-12 text-center sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        Something went wrong
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        An unexpected error interrupted this page. Nothing you uploaded left your browser.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-400"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
