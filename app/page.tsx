import type { Metadata } from "next";
import { LandingPage } from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "SpecShot — Private image tools that run in your browser",
  description:
    "Thirteen image tools that run entirely in your browser — ID photos, compress, resize, crop, convert, HEIC, PDF, and more. Nothing is uploaded, no account needed.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <LandingPage />;
}
