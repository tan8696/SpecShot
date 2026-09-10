import { Suspense } from "react";
import type { Metadata } from "next";
import { loadSpecs } from "@/lib/specs";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "ID Photo, Compress & Signature — SpecShot",
  description:
    "Crop a selfie to a government ID spec, compress a photo to an exact KB, or clean up a scanned signature — all in your browser, nothing uploaded.",
};

export default function AppPage() {
  const specs = loadSpecs();
  // AppShell reads the ?doc= / ?tool= deep links via useSearchParams, which
  // requires a Suspense boundary to keep this route statically exported
  // rather than forcing a per-request render.
  return (
    <Suspense>
      <AppShell specs={specs} />
    </Suspense>
  );
}
