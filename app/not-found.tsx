import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 py-12 text-center sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        Page not found
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-md bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-400"
      >
        Back to the tool
      </Link>
    </div>
  );
}
