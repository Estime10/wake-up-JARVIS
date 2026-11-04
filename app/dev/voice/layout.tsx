import { notFound } from "next/navigation";
import type { ReactNode } from "react";

/** Page diagnostic — inaccessible en production (L8). */
export default function DevVoiceLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return children;
}
