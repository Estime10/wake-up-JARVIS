import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DevStatesGallery } from "@/features/dev/DevStatesGallery";

const isEnabled =
  process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview";

export const metadata: Metadata = {
  title: "E.L.S.A. — états",
  robots: { index: false, follow: false },
};

export default function DevStatesPage() {
  if (!isEnabled) {
    notFound();
  }
  return <DevStatesGallery />;
}
