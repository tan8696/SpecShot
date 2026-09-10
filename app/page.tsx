import type { Metadata } from "next";
import { LandingPage } from "@/components/LandingPage";

const DESCRIPTION =
  "Thirteen image tools that run entirely in your browser — ID photos, compress, resize, crop, convert, HEIC, PDF, and more. Nothing is uploaded, no account needed.";

export const metadata: Metadata = {
  title: "SpecShot — Private image tools that run in your browser",
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: "SpecShot — Private image tools that run in your browser",
    description: DESCRIPTION,
  },
  twitter: {
    title: "SpecShot — Private image tools that run in your browser",
    description: DESCRIPTION,
  },
};

export default function Home() {
  return <LandingPage />;
}
