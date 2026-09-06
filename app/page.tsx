import { Suspense } from "react";
import { loadSpecs } from "@/lib/specs";
import { AppShell } from "@/components/AppShell";

export default function Home() {
  const specs = loadSpecs();
  // AppShell reads the ?doc= deep link via useSearchParams, which requires a
  // Suspense boundary here to keep this page statically generated rather
  // than forcing a per-request server render.
  return (
    <Suspense>
      <AppShell specs={specs} />
    </Suspense>
  );
}
