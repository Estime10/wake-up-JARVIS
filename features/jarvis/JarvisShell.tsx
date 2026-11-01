"use client";

import type { ReactNode } from "react";

import { PersistentMark } from "@/features/jarvis/components/PersistentMark";

/** Coquille app — mark unique au-dessus des routes. */
export function JarvisShell({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <PersistentMark />
    </>
  );
}
